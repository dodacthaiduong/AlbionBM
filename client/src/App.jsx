import { createBrowserRouter, RouterProvider, NavLink, Outlet } from "react-router-dom";
import HomePage from "./pages/HomePage";
import FlipPage from "./pages/FlipPage";

function Layout() {
  return (
    <div>
      <nav>
        <NavLink to="/">Giá hiện tại</NavLink>
        <NavLink to="/flip">Flip</NavLink>
      </nav>
      <Outlet />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "flip", element: <FlipPage /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
