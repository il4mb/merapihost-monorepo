import { styled } from "@mui/material";
import EditorProvider from "./cores/EditorProvider";
import Screen from "./cores/Screen";
import { NodeObject } from "./type";
import TreesManager from "./cores/panels/contents/TreesManager";
import SlotsManager from "./cores/SlotsManger";
import { Topbar } from "./cores/Topbar";
import { useRef } from "react";
import TypeRegistry from "./cores/TypeRegistry";
import { Block } from "./components/Block";
import { Navbar } from "./components/Navbar";
import LeftPanel from "./cores/panels/LeftPanel";

const EditorContainer = styled("div")({
    position: "fixed",
    top: 0,
    left: 0,
    display: "flex",
    height: "100%",
    width: "100%",
    maxWidth: "100vw",
    maxHeight: "100vh",
    flexDirection: "column",
    bgcolor: "#ececec",
    overflow: "hidden"
})

const ScreenFrame = styled("div")(({ theme }) => ({
    flex: 1,
    position: "relative",
    overflow: "hidden",
    background: "#d0d9e7",
    padding: "10px",
    borderRadius: "16px",
    boxShadow: "inset 0 2px 4px rgba(4, 16, 52, 0.58)",
    ...theme.applyStyles("dark", {
        background: "#1e1e1e",
        boxShadow: "inset 0 0px 2px rgba(255, 135, 175, 0.82)"
    })
}))

const Main = styled("div")({
    display: "flex",
    flex: 1,
    position: "relative",
    flexDirection: "row",
    overflow: "hidden"
});

const nodes = [
    {
        id: "3",
        type: "textnode",
        props: {
            content: "Hello World"
        },
        parent: "1",
    },
    {
        id: "4",
        type: "textnode",
        props: {
            content: "This is a test",
        },
        parent: "1"
    },
    {
        id: "1",
        tagName: "h1",
        parent: "2",
    },
    {
        id: "2",
        type: "Block",
        props: {
            sx: {
                padding: "5px 20px",
                backgroundColor: "#eb6b6b",
                borderRadius: "0px",
            }
        },
        parent: null,
        order: 1
    },
    {
        id: "5",
        tagName: "nav",
        props: {},
        parent: null,
        order: 0
    },
    {
        id: "6",
        tagName: "p",
        props: {},
        parent: "5",
        order: 0
    },
    {
        id: "7",
        type: "textnode",
        props: {
            content: "This is a paragraph inside the navbar"
        },
        parent: "6",
    }
];

export default function Editor() {
    const iframeRef = useRef<HTMLIFrameElement | null>(null)
    const onChange = (nodes: NodeObject[]) => {
        console.log("Changes ", nodes)
    }
    return (
        <TypeRegistry resolver={{ Block, Navbar }}>
            <EditorProvider onChange={onChange} nodes={nodes}>
                <EditorContainer>
                    <Topbar />
                    <Main>
                        <LeftPanel />
                        <ScreenFrame>
                            <Screen iframeRef={iframeRef} />
                            <SlotsManager />
                        </ScreenFrame>
                        {/* <Toolbox iframeRef={iframeRef} /> */}
                    </Main>
                </EditorContainer>
            </EditorProvider>
        </TypeRegistry>
    )
}
