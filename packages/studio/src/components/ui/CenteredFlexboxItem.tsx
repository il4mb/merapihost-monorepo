"use client";
import { Box, styled } from "@mui/material";

const CenteredFlexboxItem = styled(Box)({
    margin: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
});

export default CenteredFlexboxItem;