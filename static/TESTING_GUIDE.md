# Responsive Design Testing Guide

## Quick Testing Checklist

### ✅ Mobile Phone Testing (480px width)
Use Chrome DevTools: `Ctrl+Shift+M` on Windows or `Cmd+Shift+M` on Mac

**Test These Items:**
- [ ] Login page displays centered with readable text
- [ ] Form inputs are at least 36px tall (easy to tap)
- [ ] "Sign In" button is easily tappable
- [ ] No horizontal scrolling appears
- [ ] Footer displays properly at bottom

### ✅ Tablet Testing (768px width)
Emulate iPad in Chrome DevTools (768×1024)

**Test These Items:**
- [ ] Tables have 95% width
- [ ] Column headers are readable (not too small)
- [ ] Data rows are properly spaced
- [ ] Buttons are arranged without overflow
- [ ] All input fields are accessible

### ✅ Desktop Testing (1200px+ width)
Full browser window on desktop

**Test These Items:**
- [ ] Tables have 85% width (centered)
- [ ] Font sizes are comfortable for reading
- [ ] Column alignment looks professional
- [ ] Buttons have proper spacing
- [ ] Footer is always at bottom

### ✅ Large Desktop Testing (1920px width)
Full 1920px width screen

**Test These Items:**
- [ ] Tables don't become too wide
- [ ] Text remains readable
- [ ] No text wraps unexpectedly
- [ ] Overall layout is balanced

## Mobile Card Layout Testing

On mobile (≤480px), tables should transform to card layout:

**Each row should show:**
```
┌─────────────────────┐
│ No.        │ 1     │
│ Substance  │ Item1 │
│ Name       │ Name1 │
│ Price      │ 50.00 │
│ Status     │ OK    │
└─────────────────────┘
```

**Verify:**
- [ ] Column names appear on the left
- [ ] Data appears on the right
- [ ] Cards have clear borders
- [ ] Cards have spacing between them
- [ ] Text is left-aligned (not centered)

## Font Size Testing

**Mobile (≤480px):**
- [ ] Header title: 16px
- [ ] Table text: 10px
- [ ] Button text: 12px
- [ ] Input text: 16px (prevents zoom)

**Tablet (480px-768px):**
- [ ] Header title: 20px
- [ ] Table text: 12px
- [ ] Button text: 14px
- [ ] Input text: 12px

**Desktop (≥1200px):**
- [ ] Header title: 26px
- [ ] Table text: 14px
- [ ] Button text: 14px
- [ ] Input text: 14px

## Touch Testing (Mobile Devices)

**Button Sizing:**
- [ ] All buttons are at least 44×44px
- [ ] Buttons don't overlap
- [ ] Easy to tap with finger
- [ ] No accidental taps on nearby elements

**Form Input:**
- [ ] Input fields are at least 36px tall
- [ ] Keyboard appears without hiding inputs
- [ ] Can type comfortably
- [ ] Delete/backspace works properly

**Data Entry:**
- [ ] Datalist shows substance options clearly
- [ ] Can scroll through long lists
- [ ] Selection works correctly
- [ ] Related fields auto-fill properly

## Screen Orientation Testing

**Portrait Mode:**
- [ ] Layout adapts properly
- [ ] No content is hidden
- [ ] Buttons are accessible
- [ ] Table card layout displays

**Landscape Mode:**
- [ ] Layout adjusts to wider screen
- [ ] Tables may show more columns
- [ ] Not too stretched
- [ ] Still readable

## Image Testing

**Pill Images:**
- [ ] Images display properly on mobile
- [ ] No broken image icons
- [ ] Images scale appropriately
- [ ] Hover zoom works on desktop
- [ ] Images don't cause layout shift

## Export Function Testing

**On Mobile:**
- [ ] Export button is easily tappable
- [ ] Downloaded file appears in downloads
- [ ] Excel file opens correctly
- [ ] Data is properly formatted

**On Desktop:**
- [ ] Export button is clearly visible
- [ ] File downloads with correct name (Order_YYYY-MM-DD.xlsx)
- [ ] Excel file opens and displays data properly

## Keyboard Navigation Testing

**On Desktop:**
- [ ] Tab key moves between fields logically
- [ ] Tab moves from field to button
- [ ] Enter key submits forms
- [ ] Escape key closes any modals (if present)

**On Mobile:**
- [ ] Numeric keyboard appears for number inputs
- [ ] Email keyboard appears for email inputs
- [ ] Text keyboard appears for text inputs
- [ ] Keyboard dismiss works properly

## Browser Zoom Testing

**Desktop Browser:**
- [ ] 90% zoom: Layout should be compact but readable
- [ ] 100% zoom: Normal view
- [ ] 110% zoom: Larger view, content rearranges if needed
- [ ] 125% zoom: Still usable, may need scrolling

## CSS Media Query Verification

Check that media queries are active:

**In Chrome DevTools:**
1. Open DevTools (F12)
2. Open Console
3. Run: `window.matchMedia('(max-width: 480px)').matches`
4. Should return `true` on mobile, `false` on desktop

**Check Computed Styles:**
1. Inspect a table cell
2. Check computed styles
3. Verify correct breakpoint styles are applied
4. Look for `data-label` attribute on mobile

## Performance Testing

**Mobile Performance:**
- [ ] Page loads in < 3 seconds
- [ ] Interactions are responsive (< 100ms)
- [ ] No janky scrolling
- [ ] Images load progressively

**Desktop Performance:**
- [ ] Page loads instantly
- [ ] Smooth animations
- [ ] No layout shifts after load
- [ ] Export generates file quickly

## Accessibility Testing

- [ ] All interactive elements are keyboard accessible
- [ ] Form labels are clear
- [ ] Color contrast is sufficient
- [ ] Text is readable at actual size (no < 12px)
- [ ] Buttons have minimum 44px touch target

## Common Issues to Watch For

### ❌ Potential Mobile Issues:
- Text too small (< 12px without zoom)
- Buttons too small (< 40px)
- Horizontal scrolling needed
- Images overflow container
- Tables not transforming to card layout
- Input fields cut off by keyboard

### ❌ Potential Tablet Issues:
- Tables still too wide (> 95%)
- Font sizes inconsistent
- Button overflow
- Large white space on sides

### ❌ Potential Desktop Issues:
- Tables too narrow (< 85%)
- Text too large and hard to read
- Over-stretched layouts
- Poor use of space

## Reporting Issues

When testing and finding issues, note:
1. **Device**: iPhone 12, iPad Air, Desktop
2. **Screen Size**: 390px, 768px, 1920px
3. **Browser**: Chrome, Safari, Firefox
4. **Page**: Which page (Order, Damas, etc.)
5. **Issue**: What's wrong (text too small, button unclickable, etc.)
6. **Screenshot**: Visual evidence

## Success Criteria

✅ **Mobile (≤480px):**
- No horizontal scrolling
- All buttons tappable (44px+)
- Tables show as readable cards
- Forms are easy to fill
- Font sizes are appropriate

✅ **Tablet (768px):**
- Good use of space
- Tables readable
- Forms accessible
- Buttons properly spaced

✅ **Desktop (1200px+):**
- Professional appearance
- Optimal readability
- Good use of available space
- All features functional

---

**Last Updated:** 2026
**Breakpoints:** 320px, 480px, 768px, 1200px
