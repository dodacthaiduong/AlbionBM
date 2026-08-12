import { createBrowserRouter, RouterProvider, NavLink, Outlet, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import FlipPage from "./pages/FlipPage";
import CraftPage from "./pages/CraftPage";

function Layout() {
  return (
    <div className="min-vh-100 d-flex flex-column bg-body-tertiary">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div className="container">
          <NavLink to="/" className="navbar-brand fw-bold">
            AlbionBM
          </NavLink>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNav"
            aria-controls="mainNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="mainNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <NavLink
                  to="/price"
                  className={({ isActive }) =>
                    `nav-link${isActive ? " active" : ""}`
                  }
                >
                  Giá hiện tại
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/flip"
                  className={({ isActive }) =>
                    `nav-link${isActive ? " active" : ""}`
                  }
                >
                  Flip
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/craft"
                  className={({ isActive }) =>
                    `nav-link${isActive ? " active" : ""}`
                  }
                >
                  Craft
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <main className="container py-4 flex-grow-1">
        <Outlet />
      </main>
      <footer className="text-center text-body-secondary small py-3">
        AlbionBM
      </footer>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/price" replace /> },
      { path: "price", element: <HomePage /> },
      { path: "flip", element: <FlipPage /> },
      { path: "craft", element: <CraftPage /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
