import { TPage } from "@/types/client";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Backdrop from "@mui/material/Backdrop";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import Fade from "@mui/material/Fade";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import ImageListItemBar from "@mui/material/ImageListItemBar";
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Paper from "@mui/material/Paper";
import Popover from "@mui/material/Popover";
import Popper from "@mui/material/Popper";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import Slider from "@mui/material/Slider";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

export const REGISTRIES = {
    Typography,
    Button,
    Box,
    Container,
    Grid,
    Stack,
    TextField,
    Select,
    FormControl,
    InputLabel,
    Checkbox,
    RadioGroup,
    Radio,
    FormControlLabel,
    Switch,
    Slider,
    AppBar,
    Toolbar,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Card,
    CardContent,
    CardActions,
    CardMedia,
    Avatar,
    Badge,
    Chip,
    Tooltip,
    Snackbar,
    Alert,
    CircularProgress,
    LinearProgress,
    Pagination,
    Tabs,
    Tab,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Menu,
    MenuItem,
    Popover,
    Popper,
    Backdrop,
    Fade,
    Skeleton,
    ImageList,
    ImageListItem,
    ImageListItemBar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Link
}

export const PAGE_DATA: TPage[] = [
    {
        id: "1",
        route: "/",
        title: "Complex Dashboard",
        description: "A complex page built with MUI and PAGE_DATA structure",
        meta: [
            { name: "description", type: "meta", content: "Complex MUI page with PAGE_DATA" },
            { name: "keywords", type: "meta", content: "mui, react, complex, page" },
            { name: "author", type: "meta", content: "John Doe" },
            { name: "viewport", type: "meta", content: "width=device-width, initial-scale=1" },
            { name: "robots", type: "meta", content: "index, follow" },
            { name: "og:title", type: "meta", content: "Complex Dashboard" },
            { name: "og:description", type: "meta", content: "A complex page built with MUI" },
            { name: "og:type", type: "meta", content: "website" },
            { name: "og:url", type: "meta", content: "/" },
            { name: "og:image", type: "meta", content: "/assets/images/dashboard.png" },
            { name: "twitter:card", type: "meta", content: "summary_large_image" },
            { name: "theme-color", type: "meta", content: "#1976d2" }
        ],
        data: [
            // Root container
            {
                id: "1",
                tagName: "div",
                type: "element",
                parent: null,
                props: { className: "root-container" }
            },
            
            // App Bar / Header
            {
                id: "2",
                type: "AppBar",
                parent: "1",
                props: { 
                    position: "static",
                    color: "primary",
                    elevation: 2
                }
            },
            {
                id: "3",
                type: "Toolbar",
                parent: "2",
                props: {}
            },
            {
                id: "4",
                type: "Typography",
                parent: "3",
                props: { 
                    variant: "h6", 
                    sx: { flexGrow: 1 },
                    className: "brand-title"
                }
            },
            {
                id: "5",
                type: "textnode",
                parent: "4",
                props: { content: "📊 Complex Dashboard" }
            },
            {
                id: "6",
                type: "Button",
                parent: "3",
                props: { 
                    color: "inherit", 
                    className: "nav-btn"
                }
            },
            {
                id: "7",
                type: "textnode",
                parent: "6",
                props: { content: "Home" }
            },
            {
                id: "8",
                type: "Button",
                parent: "3",
                props: { 
                    color: "inherit", 
                    className: "nav-btn"
                }
            },
            {
                id: "9",
                type: "textnode",
                parent: "8",
                props: { content: "Features" }
            },
            {
                id: "10",
                type: "Button",
                parent: "3",
                props: { 
                    color: "inherit", 
                    className: "nav-btn"
                }
            },
            {
                id: "11",
                type: "textnode",
                parent: "10",
                props: { content: "About" }
            },
            
            // Main Content Container
            {
                id: "12",
                tagName: "main",
                type: "element",
                parent: "1",
                props: { className: "main-content" }
            },
            {
                id: "13",
                type: "Container",
                parent: "12",
                props: { 
                    maxWidth: "lg",
                    sx: { mt: 4, mb: 4 }
                }
            },
            
            // Hero Section
            {
                id: "14",
                type: "Paper",
                parent: "13",
                props: { 
                    elevation: 3,
                    sx: { 
                        p: 4, 
                        mb: 4, 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white'
                    },
                    className: "hero-paper"
                }
            },
            {
                id: "15",
                type: "Grid",
                parent: "14",
                props: { 
                    container: true,
                    spacing: 3,
                    sx: {
                        alignItems: "center"
                    }
                }
            },
            {
                id: "16",
                type: "Grid",
                parent: "15",
                props: { 
                    
                    xs: 12,
                    md: 8
                }
            },
            {
                id: "17",
                type: "Typography",
                parent: "16",
                props: { 
                    variant: "h3", 
                    gutterBottom: true,
                    className: "hero-title"
                }
            },
            {
                id: "18",
                type: "textnode",
                parent: "17",
                props: { content: "Welcome to the Complex Page" }
            },
            {
                id: "19",
                type: "Typography",
                parent: "16",
                props: { 
                    variant: "h6", 
                    className: "hero-subtitle"
                }
            },
            {
                id: "20",
                type: "textnode",
                parent: "19",
                props: { content: "Built with Material-UI and PAGE_DATA architecture" }
            },
            {
                id: "21",
                type: "Box",
                parent: "16",
                props: { 
                    sx: { mt: 3 },
                    className: "hero-actions"
                }
            },
            {
                id: "22",
                type: "Button",
                parent: "21",
                props: { 
                    variant: "contained", 
                    size: "large",
                    sx: { mr: 2 },
                    className: "btn-primary"
                }
            },
            {
                id: "23",
                type: "textnode",
                parent: "22",
                props: { content: "Get Started" }
            },
            {
                id: "24",
                type: "Button",
                parent: "21",
                props: { 
                    variant: "outlined", 
                    size: "large",
                    sx: { color: 'white', borderColor: 'white' },
                    className: "btn-secondary"
                }
            },
            {
                id: "25",
                type: "textnode",
                parent: "24",
                props: { content: "Learn More" }
            },
            {
                id: "26",
                type: "Grid",
                parent: "15",
                props: { 
                    
                    xs: 12,
                    md: 4,
                    sx: { textAlign: 'center' }
                }
            },
            {
                id: "27",
                type: "Avatar",
                parent: "26",
                props: { 
                    sx: { 
                        width: 120, 
                        height: 120, 
                        margin: '0 auto',
                        bgcolor: 'rgba(255,255,255,0.2)',
                        fontSize: 60
                    },
                    className: "hero-avatar"
                }
            },
            {
                id: "28",
                type: "textnode",
                parent: "27",
                props: { content: "🚀" }
            },
            
            // Features Section
            {
                id: "29",
                type: "Typography",
                parent: "13",
                props: { 
                    variant: "h4", 
                    gutterBottom: true,
                    sx: { mt: 4 },
                    className: "section-title"
                }
            },
            {
                id: "30",
                type: "textnode",
                parent: "29",
                props: { content: "Key Features" }
            },
            {
                id: "31",
                type: "Grid",
                parent: "13",
                props: { 
                    container: true,
                    spacing: 3,
                    sx: { mt: 2 }
                }
            },
            
            // Feature Card 1
            {
                id: "32",
                type: "Grid",
                parent: "31",
                props: { 
                    
                    xs: 12,
                    md: 4
                }
            },
            {
                id: "33",
                type: "Card",
                parent: "32",
                props: { 
                    elevation: 2,
                    className: "feature-card"
                }
            },
            {
                id: "34",
                type: "CardContent",
                parent: "33",
                props: {}
            },
            {
                id: "35",
                type: "Typography",
                parent: "34",
                props: { 
                    variant: "h5", 
                    component: "div",
                    className: "feature-title"
                }
            },
            {
                id: "36",
                type: "textnode",
                parent: "35",
                props: { content: "📦 Component-Based" }
            },
            {
                id: "37",
                type: "Typography",
                parent: "34",
                props: { 
                    variant: "body2", 
                    color: "text.secondary",
                    className: "feature-desc"
                }
            },
            {
                id: "38",
                type: "textnode",
                parent: "37",
                props: { content: "Every element is defined as a BlockNode with full nesting and MUI component support." }
            },
            
            // Feature Card 2
            {
                id: "39",
                type: "Grid",
                parent: "31",
                props: { 
                    
                    xs: 12,
                    md: 4
                }
            },
            {
                id: "40",
                type: "Card",
                parent: "39",
                props: { 
                    elevation: 2,
                    className: "feature-card"
                }
            },
            {
                id: "41",
                type: "CardContent",
                parent: "40",
                props: {}
            },
            {
                id: "42",
                type: "Typography",
                parent: "41",
                props: { 
                    variant: "h5", 
                    component: "div",
                    className: "feature-title"
                }
            },
            {
                id: "43",
                type: "textnode",
                parent: "42",
                props: { content: "🎨 MUI Integration" }
            },
            {
                id: "44",
                type: "Typography",
                parent: "41",
                props: { 
                    variant: "body2", 
                    color: "text.secondary",
                    className: "feature-desc"
                }
            },
            {
                id: "45",
                type: "textnode",
                parent: "44",
                props: { content: "Full Material-UI component library support including AppBar, Cards, Grid, and more." }
            },
            
            // Feature Card 3
            {
                id: "46",
                type: "Grid",
                parent: "31",
                props: { 
                    
                    xs: 12,
                    md: 4
                }
            },
            {
                id: "47",
                type: "Card",
                parent: "46",
                props: { 
                    elevation: 2,
                    className: "feature-card"
                }
            },
            {
                id: "48",
                type: "CardContent",
                parent: "47",
                props: {}
            },
            {
                id: "49",
                type: "Typography",
                parent: "48",
                props: { 
                    variant: "h5", 
                    component: "div",
                    className: "feature-title"
                }
            },
            {
                id: "50",
                type: "textnode",
                parent: "49",
                props: { content: "⚡ Data-Driven" }
            },
            {
                id: "51",
                type: "Typography",
                parent: "48",
                props: { 
                    variant: "body2", 
                    color: "text.secondary",
                    className: "feature-desc"
                }
            },
            {
                id: "52",
                type: "textnode",
                parent: "51",
                props: { content: "Page content is fully driven by PAGE_DATA with meta tags and dynamic rendering." }
            },
            
            // Stats Section
            {
                id: "53",
                type: "Paper",
                parent: "13",
                props: { 
                    elevation: 1,
                    sx: { p: 4, mt: 4 },
                    className: "stats-paper"
                }
            },
            {
                id: "54",
                type: "Grid",
                parent: "53",
                props: { 
                    container: true,
                    spacing: 3
                }
            },
            {
                id: "55",
                type: "Grid",
                parent: "54",
                props: { 
                    
                    xs: 12,
                    sm: 4,
                    sx: { textAlign: 'center' }
                }
            },
            {
                id: "56",
                type: "Typography",
                parent: "55",
                props: { 
                    variant: "h3", 
                    color: "primary",
                    className: "stat-number"
                }
            },
            {
                id: "57",
                type: "textnode",
                parent: "56",
                props: { content: "50+" }
            },
            {
                id: "58",
                type: "Typography",
                parent: "55",
                props: { 
                    variant: "body1", 
                    color: "text.secondary",
                    className: "stat-label"
                }
            },
            {
                id: "59",
                type: "textnode",
                parent: "58",
                props: { content: "Block Nodes" }
            },
            {
                id: "60",
                type: "Grid",
                parent: "54",
                props: { 
                    
                    xs: 12,
                    sm: 4,
                    sx: { textAlign: 'center' }
                }
            },
            {
                id: "61",
                type: "Typography",
                parent: "60",
                props: { 
                    variant: "h3", 
                    color: "secondary",
                    className: "stat-number"
                }
            },
            {
                id: "62",
                type: "textnode",
                parent: "61",
                props: { content: "15+" }
            },
            {
                id: "63",
                type: "Typography",
                parent: "60",
                props: { 
                    variant: "body1", 
                    color: "text.secondary",
                    className: "stat-label"
                }
            },
            {
                id: "64",
                type: "textnode",
                parent: "63",
                props: { content: "MUI Components" }
            },
            {
                id: "65",
                type: "Grid",
                parent: "54",
                props: { 
                    
                    xs: 12,
                    sm: 4,
                    sx: { textAlign: 'center' }
                }
            },
            {
                id: "66",
                type: "Typography",
                parent: "65",
                props: { 
                    variant: "h3", 
                    color: "success",
                    className: "stat-number"
                }
            },
            {
                id: "67",
                type: "textnode",
                parent: "66",
                props: { content: "100%" }
            },
            {
                id: "68",
                type: "Typography",
                parent: "65",
                props: { 
                    variant: "body1", 
                    color: "text.secondary",
                    className: "stat-label"
                }
            },
            {
                id: "69",
                type: "textnode",
                parent: "68",
                props: { content: "Customizable" }
            },
            
            // Footer
            {
                id: "70",
                type: "Box",
                parent: "1",
                props: { 
                    component: "footer",
                    sx: { 
                        mt: 4, 
                        py: 3, 
                        bgcolor: 'grey.100',
                        borderTop: '1px solid',
                        borderColor: 'grey.200'
                    },
                    className: "main-footer"
                }
            },
            {
                id: "71",
                type: "Container",
                parent: "70",
                props: { maxWidth: "lg" }
            },
            {
                id: "72",
                type: "Typography",
                parent: "71",
                props: { 
                    variant: "body2", 
                    color: "text.secondary",
                    align: "center",
                    className: "footer-text"
                }
            },
            {
                id: "73",
                type: "textnode",
                parent: "72",
                props: { content: "© 2026 Complex Dashboard — Built with MUI and PAGE_DATA" }
            }
        ]
    }
];