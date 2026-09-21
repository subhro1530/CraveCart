# CraveCart

A beginner-friendly React food delivery demo built with JavaScript and Vite. This is **Sprint 1**: browse a menu, filter dishes, search, add food to a cart, change quantities, and see a checkout total.

> The app uses local data and React state only. There is no backend, authentication, payment provider, or real order submission yet.

## Run the project

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Other scripts:

```bash
npm run build    # create a production build in dist/
npm run preview  # preview the production build locally
```

## What is inside the project?

```text
FirstApp/
├── index.html              # The single HTML document and root mount point
├── package.json             # Project metadata, dependencies, and npm scripts
├── README.md                # This learning guide
├── public/                  # Static files copied directly to the build
└── src/
    ├── main.jsx             # JavaScript entry point; mounts React into #root
    ├── App.jsx              # Main page and shared application state
    ├── components/
    │   ├── Header.jsx       # Brand, navigation, and cart button
    │   ├── MenuCard.jsx     # One reusable food item card
    │   └── CartPanel.jsx    # Cart drawer and price summary
    ├── data/
    │   └── menu.js          # Menu objects and category names
    └── styles/
        └── global.css      # Global styles and responsive layout
```

### How the files connect

`index.html` provides `<div id="root"></div>`. `main.jsx` calls `createRoot` and renders `<App />`. `App.jsx` owns the page-level state and passes values and functions down as props. Components return JSX and are imported like normal JavaScript modules. CSS is imported once from `main.jsx`, then applies to the whole app.

## React concepts demonstrated

### JSX

JSX lets a component describe UI with HTML-like syntax inside JavaScript:

```jsx
function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>
}
```

Use `{}` to insert a JavaScript expression. JSX uses `className` instead of `class`, and every element must close.

### Components

A component is a JavaScript function that returns JSX. `Header`, `MenuCard`, and `CartPanel` each have one clear responsibility. Component names start with a capital letter so React knows they are components.

### Props

Props are read-only inputs from a parent:

```jsx
function MenuCard({ item, onAdd }) {
  return <button onClick={() => onAdd(item)}>Add {item.name}</button>
}
```

`App` passes the menu item and an event handler to each `MenuCard`. This keeps the card reusable and lets the parent own the data.

### State with `useState`

State is data that can change while the app is open:

```jsx
const [searchTerm, setSearchTerm] = useState('')
```

Call the setter to request a re-render. When the next value depends on the previous value, use the callback form, as CraveCart does for cart updates:

```jsx
setCart((currentCart) => [...currentCart, newItem])
```

Do not mutate state directly. Create a new array or object with spread syntax, `map`, and `filter`.

### Events

React event props use camelCase: `onClick`, `onChange`, and `onSubmit`. The event handler receives an event object:

```jsx
<input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
```

### Lists and keys

Use `.map()` to turn data into elements. Each sibling needs a stable `key`, usually an ID:

```jsx
{menuItems.map((item) => <MenuCard key={item.id} item={item} />)}
```

Never use an array index as a key when items can be reordered or removed.

### Conditional rendering

CraveCart uses a ternary to show an empty-cart message or cart items:

```jsx
{cart.length === 0 ? <EmptyCart /> : <CartItems />}
```

For a simple condition, use `condition && <Thing />`.

### Derived data with `useMemo`

`visibleItems` is derived from menu data, the category, and search term. `useMemo` keeps the filtering calculation tied to those dependencies. For a tiny app, plain filtering is also fine; clarity is more important than premature optimization.

### Controlled inputs

The search input is controlled because React owns its value. The `value` comes from state and `onChange` updates state. This makes filtering and validation predictable.

### CSS and responsive design

`src/styles/global.css` contains the visual system, layout, colors, typography, and a mobile breakpoint. Vite supports CSS imports directly from JavaScript. CSS classes are currently global so the structure stays easy to inspect while learning. A larger app could use CSS Modules or a design system.

## Data flow in this app

```text
menu.js -> App.jsx -> MenuCard.jsx
                   -> Header.jsx
                   -> CartPanel.jsx
```

1. Static menu objects come from `src/data/menu.js`.
2. `App` filters them and renders one `MenuCard` per visible item.
3. `App` owns `cart`, `activeCategory`, `searchTerm`, and drawer visibility.
4. Child components receive props and call callback props when users interact.
5. State changes cause React to render the affected UI again.

This is called one-way data flow: data moves down, events move up.

## Sprint 1 plan

### Sprint goal

Create a believable menu browsing and basket experience that teaches core React fundamentals.

### Backlog completed

- Set up a Vite React JavaScript project.
- Create reusable header, menu card, and cart panel components.
- Add category tabs and live search.
- Add items to a basket and change quantities.
- Calculate subtotal, delivery fee, and total.
- Make the interface responsive for mobile and desktop.
- Document the structure and learning path.

### Definition of done

The app runs with `npm run dev`, renders without a backend, has no TypeScript requirement, and supports the main browse-to-basket journey.

## Sprint 2 ideas

- Add a real checkout form with delivery address validation.
- Persist the cart with `localStorage`.
- Add React Router for menu, restaurant, order history, and checkout pages.
- Load menu data from a mock API such as JSON Server.
- Add loading, error, and empty states around asynchronous requests.
- Add tests with Vitest and React Testing Library.
- Add accessible focus management for the cart drawer.
- Add authentication and an order history screen.

## React learning path

1. Learn JavaScript fundamentals first: arrays, objects, functions, modules, destructuring, and async code.
2. Read the official React Learn tutorials and rebuild each small example.
3. Practice props, state, events, and lists by extending this project.
4. Learn effects and data fetching only when you have a real external system to synchronize with.
5. Add routing, testing, and performance techniques after the basic flow is comfortable.

## Recommended sources

- [React official documentation](https://react.dev/learn) - The current React learning path.
- [React API reference](https://react.dev/reference/react) - Hooks and React APIs.
- [Vite guide](https://vite.dev/guide/) - Vite concepts and configuration.
- [MDN JavaScript guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide) - The JavaScript language foundations.
- [MDN HTML forms](https://developer.mozilla.org/en-US/docs/Learn/Forms) - Form semantics and browser behavior.
- [web.dev accessibility](https://web.dev/learn/accessibility/) - Building interfaces more people can use.
- [Testing Library guiding principles](https://testing-library.com/docs/guiding-principles/) - Test behavior from a user's perspective.

## A good next exercise

Add a `favorites` state to `App.jsx`. Put a heart button in `MenuCard`, pass the favorite status and toggle callback as props, and render a visual difference for favorites. This exercises state, props, events, and conditional styling without needing a backend.
