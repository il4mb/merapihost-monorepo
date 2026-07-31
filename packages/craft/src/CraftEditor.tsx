import { Paper, Grid } from '@mui/material';

import { Toolbox } from './components/Toolbox';
import { SettingsPanel } from './components/SettingsPanel';

import { Container } from './components/user/Container';
import { Button } from './components/user/Button';
import { Card, CardContent } from './components/user/Card';
import { Text } from './components/user/Text';
// @ts-ignore
import "./styles.scss";

import { Editor, Frame, Canvas, Element } from "@craftjs/core";

interface CraftEditorProps {

}
export default function CraftEditor({ }: CraftEditorProps) {
    return (
        <Editor
            resolver={{ Card, CardContent, Button, Text, Container }}
            indicator={{
                success: '#4caf50',
                error: '#f44336',
                className: 'craftjs-drag-indicator',
            }}>
            <Grid container spacing={3}>
                <Grid size={{ xs: 9 }}>
                    {/* <Canvas> */}
                    <Frame>
                        <Element is={Container} sx={{ border: '1px solid #ccc', padding: 2, minHeight: 400 }} canvas>
                            <Card title="Hello world!">
                                <Button size="small" variant="contained">
                                    Click
                                </Button>
                            </Card>
                            <Button size="small" variant="outlined">
                                Click
                            </Button>
                            <Text text="Hi world!" />
                            <Container sx={{ padding: 6, background: '#999' }}>
                                <Text text="It's me again!" />
                            </Container>
                        </Element>
                    </Frame>
                    {/* </Canvas> */}
                </Grid>
                <Grid size={{ xs: 3 }}>
                    <Paper>
                        <Toolbox />
                        <SettingsPanel />
                    </Paper>
                </Grid>
            </Grid>
        </Editor>
    );
}