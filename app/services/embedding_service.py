"""
Embedding generation service using sentence-transformers.

This service converts task text (title + description) into semantic embeddings
that can be used for similarity search and AI-powered priority suggestions.

Key Features:
- Lazy model loading (don't load until first use)
- Singleton pattern (load model once, reuse across requests)
- Graceful error handling
- Batch processing support

Model: all-MiniLM-L6-v2
- Dimensions: 384
- Size: ~90MB
- Speed: ~10-50ms per embedding on CPU
- Quality: 84% on semantic similarity benchmarks
"""

from typing import List, Optional
import numpy as np
from functools import lru_cache
from loguru import logger


class EmbeddingService:
    """
    Generate semantic embeddings for task similarity search.

    Uses sentence-transformers (BERT-based) to create 384-dimensional
    vectors that capture the semantic meaning of task text.

    Example:
        service = get_embedding_service()
        embedding = service.generate_task_embedding("Fix bug", "Resolve login issue")
        # Returns: numpy array of shape (384,)
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize embedding service.

        Args:
            model_name: Sentence-transformers model to use
                - all-MiniLM-L6-v2: 384 dim, fast, good (RECOMMENDED)
                - all-mpnet-base-v2: 768 dim, slower, better quality
                - all-MiniLM-L12-v2: 384 dim, slightly better, slightly slower

        Note: Model is not loaded until first use (lazy loading)
        """
        self.model_name = model_name
        self._model = None  # Lazy loaded
        self._embedding_dim = None

        logger.info(
            f"Embedding service initialized (model: {model_name}, lazy loading enabled)"
        )

    @property
    def model(self):
        """
        Lazy-load the sentence-transformers model.

        The model is ~90MB and takes 2-3 seconds to load, so we only
        load it when first needed (not at app startup).

        Returns:
            SentenceTransformer: Loaded model ready for encoding
        """
        if self._model is None:
            logger.info(f"Loading sentence transformer model: {self.model_name}")
            logger.info("This is a one-time operation (~2-3 seconds, ~90MB download)")

            try:
                from sentence_transformers import SentenceTransformer

                self._model = SentenceTransformer(self.model_name)
                self._embedding_dim = self._model.get_sentence_embedding_dimension()

                logger.info(
                    f"Model loaded successfully "
                    f"(dimensions: {self._embedding_dim}, "
                    f"model: {self.model_name})"
                )
            except Exception as e:
                logger.error(f"Failed to load sentence transformer model: {e}")
                raise RuntimeError(
                    f"Could not load embedding model '{self.model_name}'. "
                    "Ensure sentence-transformers is installed: "
                    "pip install sentence-transformers"
                ) from e

        return self._model

    def get_embedding_dim(self) -> int:
        """
        Get embedding dimensionality.

        Returns:
            int: Number of dimensions (384 for all-MiniLM-L6-v2)
        """
        if self._embedding_dim is None:
            # Trigger model loading
            _ = self.model
        return self._embedding_dim

    def generate_task_embedding(
        self,
        title: str,
        description: Optional[str] = None,
    ) -> np.ndarray:
        """
        Generate embedding for a task.

        Strategy:
        - Title is weighted more heavily (repeated twice)
        - Description adds context if available
        - Text is normalized before encoding

        Args:
            title: Task title (required, primary signal)
            description: Task description (optional, additional context)

        Returns:
            np.ndarray: Embedding vector of shape (384,)

        Example:
            >>> service = get_embedding_service()
            >>> emb = service.generate_task_embedding(
            ...     "Fix authentication bug",
            ...     "Users cannot log in with valid credentials"
            ... )
            >>> emb.shape
            (384,)
            >>> emb[0]
            0.23456...
        """
        # Combine title and description
        # Title weighted 2x (appears twice) because it's more important
        if description:
            text = f"{title} {title} {description}"
        else:
            text = f"{title} {title}"

        # Normalize text
        text = text.strip()

        if not text:
            raise ValueError("Cannot generate embedding from empty text")

        try:
            # Generate embedding
            embedding = self.model.encode(
                text,
                convert_to_numpy=True,
                show_progress_bar=False,
            )

            logger.debug(
                f"Generated embedding",
                text_preview=text[:50] + "..." if len(text) > 50 else text,
                embedding_shape=embedding.shape,
                embedding_norm=float(np.linalg.norm(embedding)),
            )

            return embedding

        except Exception as e:
            logger.error(
                f"Failed to generate embedding for task",
                title=title,
                description=description[:100] if description else None,
                error=str(e),
            )
            raise RuntimeError(f"Embedding generation failed: {e}") from e

    def generate_batch_embeddings(
        self,
        texts: List[str],
        batch_size: int = 32,
        show_progress: bool = True,
    ) -> np.ndarray:
        """
        Generate embeddings for multiple texts efficiently.

        Uses batching for better performance when processing many texts.

        Args:
            texts: List of text strings to encode
            batch_size: Number of texts to process at once (default: 32)
            show_progress: Show progress bar for large batches (default: True)

        Returns:
            np.ndarray: Array of embeddings, shape (len(texts), 384)

        Example:
            >>> texts = ["Task 1", "Task 2", "Task 3"]
            >>> embeddings = service.generate_batch_embeddings(texts)
            >>> embeddings.shape
            (3, 384)
        """
        if not texts:
            return np.array([])

        logger.info(
            f"Generating {len(texts)} embeddings in batches of {batch_size}"
        )

        try:
            embeddings = self.model.encode(
                texts,
                batch_size=batch_size,
                show_progress_bar=show_progress and len(texts) > 100,
                convert_to_numpy=True,
            )

            logger.info(
                f"Generated {len(embeddings)} embeddings successfully",
                batch_size=batch_size,
                total=len(texts),
            )

            return embeddings

        except Exception as e:
            logger.error(f"Batch embedding generation failed: {e}")
            raise RuntimeError(f"Batch embedding generation failed: {e}") from e

    def compute_similarity(
        self,
        embedding1: np.ndarray,
        embedding2: np.ndarray,
    ) -> float:
        """
        Compute cosine similarity between two embeddings.

        Cosine similarity measures the angle between two vectors:
        - 1.0: Identical (same direction)
        - 0.0: Orthogonal (no similarity)
        - -1.0: Opposite (completely different)

        For semantic similarity, scores typically range 0.3-0.95.

        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector

        Returns:
            float: Cosine similarity score (-1.0 to 1.0)

        Example:
            >>> emb1 = service.generate_task_embedding("Buy groceries", None)
            >>> emb2 = service.generate_task_embedding("Purchase food", None)
            >>> emb3 = service.generate_task_embedding("Fix bug", None)
            >>> service.compute_similarity(emb1, emb2)
            0.87  # Very similar!
            >>> service.compute_similarity(emb1, emb3)
            0.12  # Not similar
        """
        # Normalize vectors (convert to unit vectors)
        norm1 = embedding1 / np.linalg.norm(embedding1)
        norm2 = embedding2 / np.linalg.norm(embedding2)

        # Cosine similarity = dot product of normalized vectors
        similarity = np.dot(norm1, norm2)

        return float(similarity)

    def compute_batch_similarity(
        self,
        query_embedding: np.ndarray,
        embeddings: np.ndarray,
    ) -> np.ndarray:
        """
        Compute similarity between one query and multiple embeddings.

        Efficient batch computation for finding similar items.

        Args:
            query_embedding: Single embedding to compare, shape (384,)
            embeddings: Multiple embeddings, shape (N, 384)

        Returns:
            np.ndarray: Similarity scores, shape (N,)

        Example:
            >>> query = service.generate_task_embedding("Fix bug", None)
            >>> tasks = ["Bug 1", "Bug 2", "Buy milk"]
            >>> embs = service.generate_batch_embeddings(tasks)
            >>> sims = service.compute_batch_similarity(query, embs)
            >>> sims
            array([0.85, 0.82, 0.12])  # First two are similar bugs!
        """
        # Normalize query
        query_norm = query_embedding / np.linalg.norm(query_embedding)

        # Normalize all embeddings
        embeddings_norm = embeddings / np.linalg.norm(
            embeddings, axis=1, keepdims=True
        )

        # Compute dot products (vectorized)
        similarities = np.dot(embeddings_norm, query_norm)

        return similarities


# ============================================================================
# SINGLETON PATTERN
# ============================================================================


@lru_cache(maxsize=1)
def get_embedding_service() -> EmbeddingService:
    """
    Get singleton instance of embedding service.

    The model is heavy (~90MB in memory), so we create ONE instance
    and reuse it across all requests.

    Returns:
        EmbeddingService: Singleton instance

    Example:
        >>> service = get_embedding_service()
        >>> # Same instance returned every time:
        >>> service2 = get_embedding_service()
        >>> service is service2
        True
    """
    return EmbeddingService()
