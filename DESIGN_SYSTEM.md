# ELEVATE - Design System & UI/UX Guidelines

**Project**: Task Manager App (ELEVATE)
**Purpose**: Ensure visual consistency, professional polish, and portfolio-ready design
**Inspiration**: Notion, Asana, Monday.com (minimal, calm, productivity-focused)

---

## Brand Identity

### Name & Tagline
- **Name**: ELEVATE
- **Tagline**: Your AI Productivity Partner
- **Logo**: ArrowUp icon (Lucide React)
- **Brand Personality**: Minimal, calm, intelligent, empowering

---

## Color Palette

### Light Mode
```css
/* Primary Colors */
--primary: #3b82f6;           /* Blue - Primary actions, links */
--primary-foreground: #ffffff; /* White text on primary */

/* Backgrounds */
--background: #ffffff;         /* Pure white base */
--foreground: #0a0e1a;        /* Dark text on white */

/* Muted Elements */
--muted: #f1f5f9;             /* Light gray backgrounds */
--muted-foreground: #64748b;  /* Gray text (secondary info) */

/* Borders */
--border: #e2e8f0;            /* Light gray borders */
--input: #e2e8f0;             /* Input borders */

/* Cards */
--card: #ffffff;              /* Card backgrounds */
--card-foreground: #0a0e1a;   /* Text on cards */

/* Semantic Colors */
--success: #10b981;           /* Green - Success, completed */
--warning: #f59e0b;           /* Orange - Warning, pending */
--destructive: #ef4444;       /* Red - Errors, delete */
--info: #3b82f6;              /* Blue - Info, neutral */
```

### Dark Mode
```css
/* Primary Colors */
--primary: #3b82f6;           /* Blue - same as light */
--primary-foreground: #ffffff;

/* Backgrounds */
--background: #0a0e1a;        /* Deep blue-black base */
--foreground: #f1f5f9;        /* Light text on dark */

/* Muted Elements */
--muted: #1e293b;             /* Dark gray backgrounds */
--muted-foreground: #94a3b8;  /* Light gray text */

/* Borders */
--border: #1e293b;            /* Dark gray borders */
--input: #1e293b;

/* Cards */
--card: #0f172a;              /* Slightly lighter than background */
--card-foreground: #f1f5f9;

/* Semantic Colors */
--success: #10b981;           /* Green - same as light */
--warning: #f59e0b;
--destructive: #ef4444;
--info: #3b82f6;
```

### Category Colors (Preset Palette)
```typescript
// Vibrant colors for categories (same in light/dark)
const categoryColors = [
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f59e0b', // Orange
  '#10b981', // Green
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
];
```

---

## Typography

### Font Family
```css
/* System font stack for performance */
font-family:
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  Roboto,
  "Helvetica Neue",
  Arial,
  sans-serif;
```

### Type Scale
```typescript
// Headings
h1: 'text-3xl font-bold',      // 30px, 700 weight
h2: 'text-2xl font-semibold',  // 24px, 600 weight
h3: 'text-xl font-semibold',   // 20px, 600 weight
h4: 'text-lg font-medium',     // 18px, 500 weight

// Body
body: 'text-sm font-normal',   // 14px, 400 weight
small: 'text-xs font-normal',  // 12px, 400 weight

// Muted (secondary info)
muted: 'text-sm text-muted-foreground',

// Bold variants
'body-bold': 'text-sm font-semibold',
'small-bold': 'text-xs font-semibold',
```

### Line Height
```css
/* Tight for headings */
h1, h2, h3: line-height: 1.2;

/* Normal for body text */
body, p: line-height: 1.5;

/* Loose for form labels */
label: line-height: 1.6;
```

---

## Spacing System

### Padding Scale
```typescript
// Card padding
'card-default': 'p-6',      // 24px all sides
'card-compact': 'p-4',      // 16px all sides
'card-dense': 'p-3',        // 12px all sides

// Section spacing
'section-gap': 'space-y-6', // 24px vertical gap
'content-gap': 'space-y-4', // 16px vertical gap
'tight-gap': 'space-y-2',   // 8px vertical gap

// Component padding
'input-padding': 'px-3 py-2',  // Inputs
'button-padding': 'px-4 py-2', // Buttons
```

### Margin Scale
```typescript
// Page margins
'page-margin': 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8',

// Section margins
'section-margin': 'mb-8',  // Bottom margin between sections
'heading-margin': 'mb-4',  // Bottom margin for headings
```

### Grid Gaps
```typescript
// Grid layouts
'grid-gap-default': 'gap-6',  // 24px
'grid-gap-compact': 'gap-4',  // 16px
'grid-gap-dense': 'gap-2',    // 8px
```

---

## Border & Radius

### Border Widths
```typescript
// Standard border
'border-default': 'border',   // 1px
'border-thick': 'border-2',   // 2px

// Focus states
'focus-ring': 'focus:ring-2 focus:ring-primary focus:ring-offset-2',
```

### Border Radius
```typescript
// Rounded corners (consistent everywhere)
'radius-sm': 'rounded-sm',   // 2px - very subtle
'radius-default': 'rounded-md', // 6px - inputs, buttons
'radius-lg': 'rounded-lg',   // 8px - cards
'radius-xl': 'rounded-xl',   // 12px - modals
'radius-full': 'rounded-full', // Badges, avatars
```

---

## Shadows

### Elevation Levels
```typescript
// No shadow (flat)
'shadow-none': 'shadow-none',

// Subtle (default cards)
'shadow-sm': 'shadow-sm',

// Medium (hover states)
'shadow-md': 'shadow-md',

// Large (modals, dropdowns)
'shadow-lg': 'shadow-lg',

// Extra large (tooltips)
'shadow-xl': 'shadow-xl',
```

### Shadow Usage
```typescript
// Cards
<Card className="shadow-sm hover:shadow-md transition-shadow">

// Modals/Dialogs
<Dialog className="shadow-xl">

// Dropdowns
<DropdownMenu className="shadow-lg">
```

---

## Component Standards

### Buttons

#### Variants
```tsx
// Primary (default)
<Button variant="default">
  Save
</Button>

// Destructive (delete, cancel)
<Button variant="destructive">
  Delete
</Button>

// Outline (secondary actions)
<Button variant="outline">
  Cancel
</Button>

// Ghost (subtle actions)
<Button variant="ghost">
  <MoreVertical />
</Button>

// Link (text links)
<Button variant="link">
  Learn More
</Button>
```

#### Sizes
```tsx
// Small (h-9, px-3)
<Button size="sm">Small</Button>

// Default (h-10, px-4)
<Button>Default</Button>

// Large (h-11, px-8)
<Button size="lg">Large</Button>
```

#### States
```tsx
// Loading
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Loading...
</Button>

// Disabled
<Button disabled>Disabled</Button>

// With icon
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Add Task
</Button>
```

---

### Cards

#### Standard Card
```tsx
<Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

#### Stat Card (Dashboard)
```tsx
<Card className="p-6">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-muted-foreground">
        Label
      </p>
      <p className="text-2xl font-bold">
        42
      </p>
    </div>
    <IconComponent className="h-8 w-8 text-muted-foreground" />
  </div>
</Card>
```

#### Task Card
```tsx
<Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
  <div className="flex items-start justify-between">
    <div className="flex-1">
      <h3 className="font-medium">{task.title}</h3>
      <p className="text-sm text-muted-foreground">
        {task.description}
      </p>
    </div>
    <Badge variant={statusVariant}>{task.status}</Badge>
  </div>
  <div className="mt-3 flex items-center gap-2">
    {task.category && (
      <Badge style={{ backgroundColor: task.category.color }}>
        {task.category.name}
      </Badge>
    )}
    {task.due_date && (
      <span className="text-xs text-muted-foreground">
        Due: {formatDate(task.due_date)}
      </span>
    )}
  </div>
</Card>
```

---

### Forms

#### Input Fields
```tsx
// Text input
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="you@example.com"
    className="h-10"
  />
</div>

// Textarea
<div className="space-y-2">
  <Label htmlFor="description">Description</Label>
  <Textarea
    id="description"
    placeholder="Enter description..."
    className="min-h-[100px]"
  />
</div>

// Select
<div className="space-y-2">
  <Label>Status</Label>
  <Select>
    <SelectTrigger className="h-10">
      <SelectValue placeholder="Select status" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="todo">To Do</SelectItem>
      <SelectItem value="in_progress">In Progress</SelectItem>
      <SelectItem value="done">Done</SelectItem>
    </SelectContent>
  </Select>
</div>
```

#### Password Input with Toggle
```tsx
const [showPassword, setShowPassword] = useState(false);

<div className="space-y-2">
  <Label htmlFor="password">Password</Label>
  <div className="relative">
    <Input
      id="password"
      type={showPassword ? "text" : "password"}
      className="h-10 pr-10"
    />
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
    >
      {showPassword ? (
        <EyeOff className="h-4 w-4" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
    </button>
  </div>
</div>
```

#### Form Layout
```tsx
<form onSubmit={handleSubmit} className="space-y-6">
  <div className="space-y-4">
    {/* Form fields */}
  </div>

  <div className="flex items-center justify-end gap-3">
    <Button type="button" variant="outline" onClick={onCancel}>
      Cancel
    </Button>
    <Button type="submit">
      Submit
    </Button>
  </div>
</form>
```

---

### Badges

#### Variants
```tsx
// Default (primary)
<Badge>Default</Badge>

// Success (green)
<Badge variant="success">Completed</Badge>

// Destructive (red)
<Badge variant="destructive">Overdue</Badge>

// Secondary (gray)
<Badge variant="secondary">Pending</Badge>

// Outline (transparent)
<Badge variant="outline">Draft</Badge>
```

#### Custom Colors (Categories)
```tsx
<Badge style={{ backgroundColor: category.color }}>
  {category.name}
</Badge>
```

---

### Dialogs/Modals

#### Standard Dialog
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Optional description text
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4 py-4">
      {/* Dialog content */}
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSubmit}>
        Confirm
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### Tables

#### Standard Table
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {users.map((user) => (
      <TableRow key={user.id}>
        <TableCell className="font-medium">{user.name}</TableCell>
        <TableCell>{user.email}</TableCell>
        <TableCell>
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## Layout Patterns

### Page Layout (Dashboard)
```tsx
<DashboardLayout>
  <div className="space-y-6">
    {/* Page header */}
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Page Title</h1>
        <p className="text-muted-foreground">
          Page description
        </p>
      </div>
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        Add New
      </Button>
    </div>

    {/* Page content */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Cards or content */}
    </div>
  </div>
</DashboardLayout>
```

### Auth Layout
```tsx
<div className="flex min-h-screen items-center justify-center bg-background p-4">
  <Card className="w-full max-w-md p-6">
    <div className="mb-6 text-center">
      <h1 className="text-2xl font-bold">ELEVATE</h1>
      <p className="text-sm text-muted-foreground">
        Your AI Productivity Partner
      </p>
    </div>

    <form className="space-y-4">
      {/* Form fields */}
    </form>

    <div className="mt-6 text-center text-sm text-muted-foreground">
      <Link href="/login" className="text-primary hover:underline">
        Already have an account? Login
      </Link>
    </div>
  </Card>
</div>
```

### Grid Layouts
```tsx
// 4-column stat cards (responsive)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  {stats.map((stat) => (
    <StatCard key={stat.label} {...stat} />
  ))}
</div>

// 2-column content (responsive)
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <Card>Left content</Card>
  <Card>Right content</Card>
</div>

// 3-column feature grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {features.map((feature) => (
    <FeatureCard key={feature.id} {...feature} />
  ))}
</div>
```

---

## Icon Usage

### Icon Library
- **Library**: Lucide React
- **Size**: `h-4 w-4` (16px) for inline icons, `h-5 w-5` (20px) for buttons, `h-8 w-8` (32px) for cards

### Icon Placement
```tsx
// Leading icon (left of text)
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Add Task
</Button>

// Trailing icon (right of text)
<Button>
  Continue
  <ChevronRight className="ml-2 h-4 w-4" />
</Button>

// Icon only button
<Button variant="ghost" size="sm">
  <MoreVertical className="h-4 w-4" />
</Button>
```

### Common Icons
```typescript
// Actions
Plus - Add/Create
Edit - Edit
Trash2 - Delete
MoreVertical - More options
Check - Confirm
X - Close/Cancel

// Navigation
Home - Dashboard
ListTodo - Tasks
BarChart3 - Analytics
Grid2x2 - Priority Matrix
Sparkles - AI features
Settings - Settings
LogOut - Logout

// Status
CheckCircle2 - Success
AlertCircle - Warning
XCircle - Error
Clock - Pending

// Misc
Search - Search
Filter - Filters
Calendar - Date picker
User - User profile
Shield - Admin
```

---

## Animations

### Transitions
```css
/* Default transition for most elements */
transition: all 0.2s ease-in-out;

/* Shadow transitions (cards) */
transition: shadow 0.3s ease;

/* Color transitions (buttons, links) */
transition: color 0.2s ease, background-color 0.2s ease;
```

### Hover Effects
```tsx
// Cards
className="hover:shadow-md transition-shadow"

// Buttons
className="hover:bg-primary/90 transition-colors"

// Links
className="hover:text-primary transition-colors"

// Icons
className="hover:scale-110 transition-transform"
```

### Loading Animations
```tsx
// Spinner
<Loader2 className="h-4 w-4 animate-spin" />

// Skeleton (pulsing placeholder)
<div className="h-4 w-full bg-muted animate-pulse rounded" />

// Fade in
<div className="animate-fadeIn">
  Content
</div>
```

---

## Accessibility

### ARIA Labels
```tsx
// Buttons with icons only
<button aria-label="Delete task">
  <Trash2 className="h-4 w-4" />
</button>

// Form labels
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />

// Dialogs
<Dialog>
  <DialogContent aria-describedby="dialog-description">
    <DialogDescription id="dialog-description">
      Confirmation message
    </DialogDescription>
  </DialogContent>
</Dialog>
```

### Keyboard Navigation
```tsx
// Focus states (all interactive elements)
className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"

// Skip to content link
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### Color Contrast
- **WCAG AA Standard**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Light Mode**: Dark text (#0a0e1a) on white (#ffffff) = 19:1 ✅
- **Dark Mode**: Light text (#f1f5f9) on dark (#0a0e1a) = 18:1 ✅

---

## Responsive Design

### Breakpoints
```typescript
// Tailwind default breakpoints
sm: '640px',   // Mobile landscape
md: '768px',   // Tablet
lg: '1024px',  // Desktop
xl: '1280px',  // Large desktop
2xl: '1536px', // Extra large
```

### Mobile-First Approach
```tsx
// Start with mobile styles, add larger breakpoints
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* 1 column on mobile, 2 on tablet, 4 on desktop */}
</div>

// Hide on mobile, show on desktop
<div className="hidden lg:block">
  Desktop only content
</div>

// Show on mobile, hide on desktop
<div className="block lg:hidden">
  Mobile only content
</div>
```

### Touch Targets
```tsx
// Minimum 44x44px for touch targets (mobile)
<button className="min-h-[44px] min-w-[44px] p-3">
  Tap Me
</button>
```

---

## Loading States

### Skeleton Loaders
```tsx
// Card skeleton
<Card className="p-6">
  <div className="space-y-3">
    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
    <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
    <div className="h-20 w-full bg-muted animate-pulse rounded" />
  </div>
</Card>

// Task list skeleton
<div className="space-y-4">
  {[...Array(5)].map((_, i) => (
    <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
  ))}
</div>
```

---

## Empty States

### No Data
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <ListTodo className="h-12 w-12 text-muted-foreground mb-4" />
  <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
  <p className="text-sm text-muted-foreground mb-6">
    Get started by creating your first task
  </p>
  <Button onClick={handleCreate}>
    <Plus className="mr-2 h-4 w-4" />
    Create Task
  </Button>
</div>
```

---

## Error States

### Error Message
```tsx
<div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
  <AlertCircle className="h-5 w-5 text-destructive" />
  <div className="flex-1">
    <p className="text-sm font-medium text-destructive">
      Error loading tasks
    </p>
    <p className="text-xs text-destructive/80">
      {error.message}
    </p>
  </div>
  <Button variant="ghost" size="sm" onClick={retry}>
    Retry
  </Button>
</div>
```

---

## Documentation & Maintenance

### Component Checklist
Before creating/updating a component, ensure:
- [ ] Uses design tokens (colors, spacing, shadows)
- [ ] Supports light and dark mode
- [ ] Has proper TypeScript types
- [ ] Includes ARIA labels for accessibility
- [ ] Has focus states for keyboard navigation
- [ ] Is responsive (mobile, tablet, desktop)
- [ ] Follows naming conventions (PascalCase for components)
- [ ] Has loading and error states
- [ ] Uses consistent spacing (p-6 for cards, etc.)

### Code Review Standards
- No inline Tailwind overrides without justification
- Reuse existing components instead of creating new ones
- Extract repeated patterns into utilities
- Document complex logic with comments
- Use semantic HTML (`<button>`, `<nav>`, etc.)
- Ensure all images have alt text
- Test keyboard navigation

---

**End of Design System**
