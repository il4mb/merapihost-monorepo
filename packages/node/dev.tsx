import { createRoot } from "react-dom/client";
import { useState } from "react";
import ContainerProvider from "@/react/ContainerProvider";
import RootDocument from "@/react/RootDocument";

function App() {
    const [count, setCount] = useState(0);
    return (
        <ContainerProvider>
            <RootDocument />
        </ContainerProvider>
    );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
