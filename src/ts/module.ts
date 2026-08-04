// Keep or else Foundry globals like game and Hooks will not resolve
/// <reference types="@dfreds/foundry-types" />

import "izitoast/dist/css/iziToast.min.css";
import "../styles/style.scss"; // Keep or else vite will not include this
import { HooksNotifications } from "./hooks/index.ts";

HooksNotifications.listen();
