import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {EventProvider} from "./event/EventContext.tsx";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <EventProvider>
            <App/>
        </EventProvider>
    </React.StrictMode>,
);
