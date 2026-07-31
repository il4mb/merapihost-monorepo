import { Paper, Grid } from '@mui/material';

import { Toolbox } from './components/Toolbox';
import { SettingsPanel } from './components/SettingsPanel';

import { Container } from './components/user/Container';
import { Button } from './components/user/Button';
import { Card } from './components/user/Card';
import { Text } from './components/user/Text';

import { Editor, Frame } from "@craftjs/core";

export default function CraftEditor() {
    return (
        <Editor resolver={{ Card, Button, Text, Container }}>
            <Grid container spacing={3}>
                <Grid size={{ xs: 9 }}>
                    <Frame>
                        <Container sx={{ padding: 2, background: '#eee' }}>
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
                        </Container>
                    </Frame>
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