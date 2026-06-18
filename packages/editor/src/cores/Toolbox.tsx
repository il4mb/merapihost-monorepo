import { Box, Typography } from "@mui/material"
import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { NodeObject } from "../type"
import { useEditor } from "./EditorProvider"
import ModifiersProvider from "./ModifiersProvider"

type ToolboxProps = {
    iframeRef: React.RefObject<HTMLIFrameElement | null>
}
export const Toolbox = memo(({ iframeRef }: ToolboxProps) => {
    const [styleDialogOpen, setStyleDialogOpen] = useState(false)
    const { state, dispatch } = useEditor()
    const selected = useMemo(() => {
        return Array.from(state.selected)
            .map(id => state.nodes.get(id))
            .filter((node): node is NodeObject => !!node)
    }, [state.selected, state.nodes])

    const selectedNode = useMemo(() => {
        if (selected.length === 0 || selected.length > 1) return {}
        const data = selected[0].data
        if ("style" in data.props) {
            return {
                id: selected[0].id,
                style: data.props.style as Record<string, string>
            }
        }
    }, [selected])

    useEffect(() => {
        if (styleDialogOpen) {
            setStyleDialogOpen(false)
        }
    }, [selectedNode?.id])

    return (
        <Box sx={{ width: 250, p: 3 }}>
            <ModifiersProvider />
        </Box>
    )
});