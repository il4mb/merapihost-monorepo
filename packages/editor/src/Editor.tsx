import { styled, Theme } from "@mui/material";
import EditorProvider from "./cores/EditorProvider";
import Screen from "./cores/Screen";
import type { NodeObject } from "./types/node";
import SlotsManager from "./cores/SlotsManger";
import { TopbarPanel } from "./components/panels/TopbarPanel";
import { useRef } from "react";
import TypeRegistry from "./cores/TypeRegistry";
import { Block } from "./components/types";
import LeftPanel from "./components/panels/LeftPanel";
import RightPanel from "./components/panels/RightPanel";

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
                '@media (max-width: 600px)': {
                    backgroundColor: "#6b9deb",
                }
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
        order: 0,
    },
    {
        id: "7",
        type: "textnode",
        props: {
            content: "This is a paragraph inside the navbar"
        },
        parent: "6",
    },
    {
        id: "8",
        type: "Slots",
        props: {},
        parent: null,
    },
    {
        id: "9",
        tagName: "div",
        parent: "8",
        props: {
            style: {
            }
        }
    },
    {
        id: "10",
        tagName: "p",
        parent: "9",
    },
    {
        id: "11",
        type: "textnode",
        props: {
            content: "This is a paragraph inside the slot"
        },
        parent: "10",
    },
    {
        id: "12",
        tagName: "button",
        parent: "9",
        props: {
        }
    },
    {
        id: "13",
        type: "textnode",
        props: {
            content: "Click me",
            events: {
                "onClick": [
                    "alert('Button clicked!')"
                ]
            }
        },
        parent: "12",
    }
];

interface EditorProps {
    theme: Theme
}
export default function Editor({ theme }: EditorProps) {
    const iframeRef = useRef<HTMLIFrameElement | null>(null)
    const onChange = (nodes: NodeObject[]) => {
        console.log("Changes ", nodes)
    }
    return (
        <TypeRegistry resolver={{ Block }}>
            <EditorProvider onChange={onChange} nodes={nodes}>
                <EditorContainer>
                    <TopbarPanel />
                    <Main>
                        <LeftPanel />
                        <ScreenFrame>
                            <Screen
                                theme={theme}
                                iframeRef={iframeRef} />
                            <SlotsManager />
                        </ScreenFrame>
                        <RightPanel />
                    </Main>

                </EditorContainer>
            </EditorProvider>
        </TypeRegistry>
    )
}
