import EditorCanvas from "@/components/screens/EditorCanvas";
import NodeStatusIndicator from "@/components/screens/NodeStatusIndicator";
import ScreenContainer from "@/components/screens/ScreenContainer";
import ScreenFrame from "@/components/screens/ScreenFrame";
import { serverApi } from "@/libs/api-server";
import { Box, Container, Typography } from "@mui/material";
import { Fragment } from "react";

const TEST_WEB_ID = "6a70c8335ea713aa44dd3209";
type PageProps = {
    params: Promise<{ pageId: string }>;
}
export default async function Page({ params }: PageProps) {
    const { pageId } = await params;
    const { data: response } = await serverApi.get(`/v1/websites/${TEST_WEB_ID}/webpages/${pageId}`);

    if (!response.success) {
        return (
            <ScreenContainer>
                <ScreenFrame>
                    <Container maxWidth="sm">
                        <Box sx={{
                            display: "flex",
                            flexDirection: "column",
                            height: "100%"
                        }}>
                            <Typography
                                variant="h4"
                                gutterBottom
                                sx={{ color: "error.main", fontWeight: "bold", textAlign: "left" }}>
                                Catch an Error
                            </Typography>
                            <Typography variant="body1">
                                {response.message || "An unexpected error occurred while loading the page."}
                            </Typography>
                        </Box>
                    </Container>
                </ScreenFrame>
            </ScreenContainer>
        );
    }

    const nodes = response.data?.nodes || [];

    return (
        <Fragment>
            <NodeStatusIndicator />
            <ScreenContainer>
                <ScreenFrame>
                    <EditorCanvas nodes={nodes} />
                </ScreenFrame>
            </ScreenContainer>
        </Fragment>
    );
}
