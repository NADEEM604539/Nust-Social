# NUST SOCIAL - Design System

## Color Palette

### Primary Colors
- **Purple-Pink Gradient** (Login): `from-purple-500 to-pink-500`
  - Accent: `purple-400`, `pink-400`
  - Hover: `from-purple-600 to-pink-600`

- **Blue-Cyan Gradient** (Register): `from-blue-500 to-cyan-500`
  - Accent: `blue-400`, `cyan-400`
  - Hover: `from-blue-600 to-cyan-600`

- **Green-Emerald Gradient** (OTP/Success): `from-green-500 to-emerald-500`
  - Accent: `green-400`, `emerald-400`
  - Hover: `from-green-600 to-emerald-600`

### Background Colors
- **Primary Background**: `bg-gradient-to-br from-slate-900 via-[color]-900 to-slate-900`
- **Card Background**: `backdrop-blur-xl bg-white/10 border border-white/20`
- **Input Background**: `bg-white/5 border border-white/10`
- **Hover States**: `hover:bg-white/10 hover:border-white/20`

### Text Colors
- **Primary Text**: `text-white`
- **Secondary Text**: `text-gray-300`
- **Muted Text**: `text-gray-400`, `text-gray-500`
- **Error Text**: `text-red-200`, `text-red-400`
- **Success Text**: `text-green-200`, `text-green-400`

### Alert Colors
- **Error Alert**: `bg-red-500/10 border-red-500/30`
- **Success Alert**: `bg-green-500/10 border-green-500/30`
- **Info Alert**: `bg-blue-500/10 border-blue-500/30`
- **Warning Alert**: `bg-yellow-500/10 border-yellow-500/30`

---

## Typography

### Headings
- **H1 (Main Title)**: `text-3xl font-bold text-white`
- **H2 (Subtitle)**: `text-gray-300 text-sm`
- **H3 (Form Labels)**: `text-sm font-semibold text-gray-200`

### Body Text
- **Regular**: `text-sm text-gray-300`
- **Muted**: `text-xs text-gray-400`
- **Links**: `text-[color]-400 hover:text-[color]-300 font-semibold`

---

## Components

### Buttons

#### Primary Button (CTA)
```tsx
<button className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-[color1]-500 to-[color2]-500 hover:from-[color1]-600 hover:to-[color2]-600 transition-all duration-200 shadow-lg hover:shadow-xl">
  Button Text
</button>
```

#### Secondary Button
```tsx
<button className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-300 hover:text-white font-medium transition-all duration-200">
  Button Text
</button>
```

### Input Fields
```tsx
<input
  type="text"
  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[color]-500/50 focus:ring-2 focus:ring-[color]-500/20 transition-all duration-200"
  placeholder="Placeholder text"
/>
```

### Cards
```tsx
<div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
  {/* Content */}
</div>
```

### Alerts
```tsx
<div className="p-4 rounded-xl bg-[status]-500/10 border border-[status]-500/30 flex items-start gap-3">
  <span className="text-[status]-400 text-lg mt-0.5">Icon</span>
  <p className="text-[status]-200 text-sm">Message</p>
</div>
```

---

## Animations

### Blob Animation (Background)
```css
@keyframes blob {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
```

### Loading Spinner
```tsx
<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
```

---

## Spacing Scale

- **xs**: `2px` (0.125rem)
- **sm**: `4px` (0.25rem)
- **md**: `8px` (0.5rem)
- **lg**: `12px` (0.75rem)
- **xl**: `16px` (1rem)
- **2xl**: `24px` (1.5rem)

---

## Responsive Design

- **Mobile First**: All components are optimized for mobile
- **Max Width Container**: `max-w-md` for auth pages
- **Padding**: `p-4` for mobile, scales appropriately
- **Breakpoints**:
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px

---

## Glassmorphism Effect

The UI uses glassmorphism with:
- **Backdrop Blur**: `backdrop-blur-xl`
- **Background**: `bg-white/10` (10% white opacity)
- **Border**: `border-white/20` (20% white opacity)
- **Focus Ring**: `focus:ring-[color]-500/20` (20% color opacity)

---

## Shadow System

- **Base Shadow**: `shadow-lg`
- **Hover Shadow**: `shadow-xl hover:shadow-[color]-500/30`
- **None on Disabled**: `disabled:shadow-none`

---

## Transitions

- **Default Duration**: `duration-200`
- **Easing**: `transition-all` for smooth transitions
- **Focus States**: Smooth color and ring transitions

---

## Accessibility Features

- ✅ Proper form labels
- ✅ Keyboard navigation support
- ✅ Focus indicators
- ✅ Error messages
- ✅ Screen reader friendly text
- ✅ High contrast text
- ✅ Disabled state styling

---

## Reusable Patterns

### Form Group
```tsx
<div>
  <label className="block text-sm font-semibold text-gray-200 mb-2">
    Label
  </label>
  <input className="..." />
</div>
```

### Icon with Input
```tsx
<div className="relative">
  <input className="..." />
  <span className="absolute right-4 top-3.5 text-gray-400">Icon</span>
</div>
```

### Divider
```tsx
<div className="flex items-center gap-3">
  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
  <span className="text-xs text-gray-400 font-medium">Text</span>
  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
</div>
```

---

## Future Pages Color Schemes

### Home Feed
Primary: `from-teal-500 to-cyan-500`
Background: `from-slate-900 via-teal-900 to-slate-900`

### Marketplace
Primary: `from-orange-500 to-red-500`
Background: `from-slate-900 via-orange-900 to-slate-900`

### Events
Primary: `from-indigo-500 to-purple-500`
Background: `from-slate-900 via-indigo-900 to-slate-900`

### Chat
Primary: `from-sky-500 to-blue-500`
Background: `from-slate-900 via-sky-900 to-slate-900`

### Profile
Primary: `from-rose-500 to-pink-500`
Background: `from-slate-900 via-rose-900 to-slate-900`

---

## Best Practices

1. **Consistency**: Always use the defined color gradients
2. **Spacing**: Use Tailwind spacing scale consistently
3. **Shadows**: Apply shadows to interactive elements
4. **Borders**: Use `border-white/[10-30]` for subtle borders
5. **Focus States**: Always include focus rings for accessibility
6. **Animations**: Keep animations smooth and purposeful
7. **Dark Mode**: All components are dark mode by default
8. **Glassmorphism**: Leverage the blur effect for depth
9. **Micro-interactions**: Add hover and focus effects
10. **Loading States**: Always show loading feedback

---

## Icons Used

- Email: `✉`
- Eye Open: `👁`
- Eye Closed: `👁‍🗨`
- User: `👤`
- Check: `✓`
- Warning: `⚠`
- Info: `💡`
- Google: `G`
- Facebook: `f`

---

## Version
- **Created**: March 30, 2026
- **Last Updated**: March 30, 2026
- **Maintained by**: NUST SOCIAL Design Team
