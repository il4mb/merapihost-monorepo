import { Box } from "@mui/material";
import SelectedIndicators from "./indicators/SelectedIndicators";

type SpotsContainerProps = {

};

export default function SpotsContainer({ }: SpotsContainerProps) {
    return (
        <Box sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 9999,
        }}>
            <SelectedIndicators />
        </Box>
    );
}
