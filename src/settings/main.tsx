import React from "react";
import ReactDOM from "react-dom/client";
import Setting from "./Setting.tsx";
import {BrowserRouter} from "react-router";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <BrowserRouter>
            <Setting/>
        </BrowserRouter>
    </React.StrictMode>,
);
