import { createRoot } from "react-dom/client";
import { useState } from "react";
import DocumentProvider from "@/react/DocumentProvider";
import RootDocument from "@/react/RootDocument";

function App() {
    const [count, setCount] = useState(0);
    return (
        <DocumentProvider>
            <RootDocument />
        </DocumentProvider>
    );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
