import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Providers } from "./providers";
// Import service worker registration
// @ts-ignore - Ignoring the module declaration file issue
import { register as registerServiceWorker } from '../../public/serviceWorkerRegistration';

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <Providers>
      <App />
    </Providers>
  </QueryClientProvider>
);

// Define a type for the ServiceWorkerRegistration
interface PWAConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
registerServiceWorker({
  onSuccess: (registration: ServiceWorkerRegistration) => {
    console.log('PWA successfully registered!', registration);
  },
  onUpdate: (registration: ServiceWorkerRegistration) => {
    console.log('New content is available; please refresh.', registration);
  }
} as PWAConfig);
