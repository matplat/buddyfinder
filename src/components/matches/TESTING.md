# Manual Testing Checklist for MatchesView

## Loading State
- [ ] Skeleton is displayed on initial page load
- [ ] Skeleton has 5 placeholder cards with pulse animation
- [ ] Skeleton maintains proper spacing and layout

## Empty States

### No Location Set
- [ ] Card with MapPin icon is displayed
- [ ] Title: "Brak ustawionej lokalizacji"
- [ ] Description explains need to set location
- [ ] "Uzupełnij profil" button is visible
- [ ] Button redirects to /profile page

### No Matches
- [ ] Card with Users icon is displayed
- [ ] Title: "Brak dopasowań"
- [ ] Description suggests increasing range
- [ ] "Edytuj profil" button is visible
- [ ] Button redirects to /profile page

### Generic Error
- [ ] Card with AlertCircle icon is displayed
- [ ] Title: "Wystąpił błąd"
- [ ] Description mentions trying again later
- [ ] No CTA button present

## Matches List

### Display
- [ ] Header shows "Twoje dopasowania"
- [ ] Subtitle shows total count (e.g., "Znaleziono 5 osób")
- [ ] Matches are displayed in accordion format
- [ ] Only one accordion item can be expanded at a time

### Match Card - Collapsed
- [ ] Shows display name in bold
- [ ] Shows distance with MapPin icon (e.g., "2.3 km")
- [ ] Chevron icon indicates expandable state

### Match Card - Expanded
- [ ] Email is displayed with Mail icon
- [ ] Email is clickable (mailto: link)
- [ ] Sports section is present if user has sports
- [ ] Each sport shows name and parameters
- [ ] Sport parameters are displayed as small badges
- [ ] Social media section is present if user has links
- [ ] Social links show platform icon and name
- [ ] Social links open in new tab
- [ ] Links have proper hover states

### Pagination
- [ ] "Załaduj więcej" button is visible when hasNextPage is true
- [ ] Button shows loading state when fetching more
- [ ] New matches are appended to the list
- [ ] Button disappears when all matches are loaded
- [ ] No duplicate matches appear

## Accessibility
- [ ] All interactive elements are keyboard accessible
- [ ] Accordion can be navigated with Tab key
- [ ] Accordion can be expanded/collapsed with Enter/Space
- [ ] Social links have proper aria-labels
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG standards

## Responsive Design
- [ ] Layout works on mobile (< 640px)
- [ ] Layout works on tablet (640px - 1024px)
- [ ] Layout works on desktop (> 1024px)
- [ ] Text is readable at all breakpoints
- [ ] Buttons are touchable on mobile

## Error Handling
- [ ] Network errors are caught and displayed
- [ ] 400 errors show "no location" state
- [ ] 500+ errors show generic error state
- [ ] Loading states don't flicker on fast connections

## Performance
- [ ] Initial load is smooth
- [ ] Accordion expand/collapse is instant
- [ ] "Załaduj więcej" doesn't cause lag
- [ ] No memory leaks on repeated navigation
