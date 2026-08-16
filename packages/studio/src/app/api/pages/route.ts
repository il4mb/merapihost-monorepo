import { NextRequest, NextResponse } from "next/server";
import { serverApi } from "@/libs/api-server";
import { NodeObject } from "@/types";

const TEST_WEB_ID = "6a70c8335ea713aa44dd3209";

export const GET = async (req: NextRequest) => {
    try {
        const response = await serverApi.get(`/v1/websites/${TEST_WEB_ID}/webpages`);
        return NextResponse.json(response.data, {
            status: response.status
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: error.message || "An unexpected error occurred"
        }, { status: 500 });
    }
}

export const POST = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const response = await serverApi.post(`/v1/websites/${TEST_WEB_ID}/webpages`, {
            nodes: INITIAL_PAGE_LAYOUT,
            meta: null,
            ...body
        });
        return NextResponse.json(response.data, {
            status: response.status
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: error.message || "An unexpected error occurred"
        }, { status: 500 });
    }
}


const INITIAL_PAGE_LAYOUT: NodeObject[] = [
    // Header section
    {
        id: "header",
        tagName: "header",
        props: {
            sx: {
                backgroundColor: "#f5f5f5",
                padding: "10px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #e0e0e0"
            }
        },
        parent: null,
        order: 0,
        visible: true
    },

    // Header logo container
    {
        id: "header-logo",
        tagName: "div",
        content: "My Brand",
        props: {
            sx: {
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#1976d2",
                cursor: "pointer"
            }
        },
        parent: "header",
        order: 0,
        visible: true
    },

    // Header navigation
    {
        id: "header-nav",
        tagName: "nav",
        props: {
            sx: {
                display: "flex",
                gap: "20px"
            }
        },
        parent: "header",
        order: 1,
        visible: true
    },

    // Nav links containers
    {
        id: "nav-home",
        tagName: "a",
        props: {
            href: "#",
            sx: {
                color: "#333",
                textDecoration: "none",
                "&:hover": { color: "#1976d2" }
            }
        },
        parent: "header-nav",
        content: "Home",

        order: 0,
        visible: true
    },
    {
        id: "nav-about",
        tagName: "a",
        props: {
            href: "#",
            sx: {
                color: "#333",
                textDecoration: "none",
                "&:hover": { color: "#1976d2" }
            }
        },
        parent: "header-nav",
        order: 1,
        content: "About"
    },

    {
        id: "nav-contact",
        tagName: "a",
        props: {
            href: "#",
            sx: {
                color: "#333",
                textDecoration: "none",
                "&:hover": { color: "#1976d2" }
            }
        },
        parent: "header-nav",
        order: 2,
        visible: true,
        content: "Contact",
    },

    // Main content area
    {
        id: "main",
        tagName: "main",
        props: {
            sx: {
                padding: {
                    xs: "10px",
                    sm: "15px",
                    md: "20px",
                    lg: "30px",
                    xl: "40px"
                },
                minHeight: "500px",
                maxWidth: "1200px",
                margin: "0 auto",
                width: "100%"
            }
        },
        parent: null,
        order: 1,
        visible: true
    },

    // Main content wrapper
    {
        id: "main-content",
        tagName: "div",
        props: {
            sx: {
                padding: "20px",
                backgroundColor: "#ffffff",
                borderRadius: "8px"
            }
        },
        parent: "main",
        order: 0,
        visible: true
    },

    // Hero section
    {
        id: "hero-section",
        tagName: "div",
        props: {
            sx: {
                textAlign: "center",
                padding: "40px 20px",
                backgroundColor: "#e3f2fd",
                borderRadius: "8px",
                marginBottom: "30px"
            }
        },
        parent: "main-content",
        order: 0,
        visible: true
    },

    // Hero title
    {
        id: "hero-title",
        tagName: "h1",
        props: {
            sx: {
                fontSize: {
                    xs: "2rem",
                    sm: "2.5rem",
                    md: "3rem"
                },
                fontWeight: "bold",
                color: "#0d47a1",
                marginBottom: "1rem"
            }
        },
        parent: "hero-section",
        order: 0,
        visible: true,
        content: "Welcome to Your New Page",
    },
    // Hero subtitle
    {
        id: "hero-subtitle",
        tagName: "p",
        props: {
            sx: {
                fontSize: {
                    xs: "1rem",
                    md: "1.25rem"
                },
                color: "#1565c0",
                maxWidth: "600px",
                margin: "0 auto"
            }
        },
        parent: "hero-section",
        content: "This is your starting point. Customize this page to match your brand and content needs.",
        order: 1,
        visible: true
    },

    // Features section
    {
        id: "features-section",
        tagName: "div",
        props: {
            sx: {
                display: "grid",
                gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1fr 1fr",
                    md: "1fr 1fr 1fr"
                },
                gap: "20px",
                marginTop: "30px"
            }
        },
        parent: "main-content",
        order: 1,
        visible: true
    },

    // Feature card 1
    {
        id: "feature-1",
        tagName: "div",
        props: {
            sx: {
                padding: "20px",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                textAlign: "center",
                "&:hover": {
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    transform: "translateY(-2px)",
                    transition: "all 0.3s ease"
                }
            }
        },
        parent: "features-section",
        order: 0,
        visible: true
    },
    {
        id: "feature-1-icon",
        tagName: "div",
        content: "📝",
        props: {
            sx: {
                fontSize: "2.5rem",
                marginBottom: "10px"
            }
        },
        parent: "feature-1",
        order: 0,
        visible: true
    },
    {
        id: "feature-1-title",
        tagName: "h3",
        props: {
            sx: {
                fontSize: "1.25rem",
                fontWeight: "bold",
                color: "#333",
                marginBottom: "10px"
            }
        },
        content: "Easy Editing",
        parent: "feature-1",
        order: 1,
        visible: true
    },
    {
        id: "feature-1-text",
        tagName: "p",
        props: {
            sx: {
                color: "#666",
                lineHeight: 1.6
            }
        },
        parent: "feature-1",
        content: "Edit any element directly on the page. Click to change text, styles, and more.",
        order: 2,
        visible: true
    },

    // Feature card 2
    {
        id: "feature-2",
        tagName: "div",
        props: {
            sx: {
                padding: "20px",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                textAlign: "center",
                "&:hover": {
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    transform: "translateY(-2px)",
                    transition: "all 0.3s ease"
                }
            }
        },
        parent: "features-section",
        order: 1,
        visible: true
    },
    {
        id: "feature-2-icon",
        content: "🎨",
        tagName: "div",
        props: {
            sx: {
                fontSize: "2.5rem",
                marginBottom: "10px"
            }
        },
        parent: "feature-2",
        order: 0,
        visible: true
    },
    {
        id: "feature-2-title",
        tagName: "h3",
        props: {
            sx: {
                fontSize: "1.25rem",
                fontWeight: "bold",
                color: "#333",
                marginBottom: "10px"
            }
        },
        content: "Custom Styling",
        parent: "feature-2",
        order: 1,
        visible: true
    },
    {
        id: "feature-2-text",
        tagName: "p",
        props: {
            sx: {
                color: "#666",
                lineHeight: 1.6
            }
        },
        parent: "feature-2",
        content: "Use MUI's sx prop for responsive, theme-aware styling. Customize colors, spacing, and more.",
        order: 2,
        visible: true
    },

    // Feature card 3
    {
        id: "feature-3",
        tagName: "div",
        props: {
            sx: {
                padding: "20px",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                textAlign: "center",
                "&:hover": {
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    transform: "translateY(-2px)",
                    transition: "all 0.3s ease"
                }
            }
        },
        parent: "features-section",
        order: 2,
        visible: true
    },
    {
        id: "feature-3-icon",
        tagName: "div",
        content: "🚀",
        props: {
            sx: {
                fontSize: "2.5rem",
                marginBottom: "10px"
            }
        },
        parent: "feature-3",
        order: 0,
        visible: true
    },
    {
        id: "feature-3-title",
        tagName: "h3",
        content: "Ready to Publish",
        props: {
            sx: {
                fontSize: "1.25rem",
                fontWeight: "bold",
                color: "#333",
                marginBottom: "10px"
            }
        },
        parent: "feature-3",
        order: 1,
        visible: true
    },
    {
        id: "feature-3-text",
        tagName: "p",
        props: {
            sx: {
                color: "#666",
                lineHeight: 1.6
            }
        },
        parent: "feature-3",
        content: "Your page is fully responsive and ready for production. Just add your content and go live!",
        order: 2,
        visible: true
    },
    // Call to action section
    {
        id: "cta-section",
        tagName: "div",
        props: {
            sx: {
                textAlign: "center",
                padding: "40px 20px",
                marginTop: "30px",
                backgroundColor: "#f5f5f5",
                borderRadius: "8px"
            }
        },
        parent: "main-content",
        order: 2,
        visible: true
    },
    {
        id: "cta-title",
        tagName: "h2",
        props: {
            sx: {
                fontSize: "2rem",
                fontWeight: "bold",
                color: "#333",
                marginBottom: "1rem"
            }
        },
        content: "Ready to Get Started?",
        parent: "cta-section",
        order: 0,
        visible: true
    },
    {
        id: "cta-text",
        tagName: "p",
        props: {
            sx: {
                fontSize: "1.1rem",
                color: "#666",
                marginBottom: "20px"
            }
        },
        content: "Begin customizing your page by clicking on any element. Add your own content, images, and styling.",
        parent: "cta-section",
        order: 1,
        visible: true
    },
    {
        id: "cta-button",
        tagName: "button",
        props: {
            sx: {
                backgroundColor: "#1976d2",
                color: "#ffffff",
                padding: "12px 30px",
                border: "none",
                borderRadius: "4px",
                fontSize: "1rem",
                fontWeight: "bold",
                cursor: "pointer",
                "&:hover": {
                    backgroundColor: "#1565c0"
                }
            }
        },
        content: "Start Editing",
        parent: "cta-section",
        order: 2,
        visible: true
    },

    // Footer section
    {
        id: "footer",
        tagName: "footer",
        props: {
            sx: {
                backgroundColor: "#f5f5f5",
                padding: "20px",
                marginTop: "auto",
                borderTop: "1px solid #e0e0e0"
            }
        },
        parent: null,
        order: 2,
        visible: true
    },

    // Footer content wrapper
    {
        id: "footer-content",
        tagName: "div",
        props: {
            sx: {
                maxWidth: "1200px",
                margin: "0 auto",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px"
            }
        },
        parent: "footer",
        order: 0,
        visible: true
    },

    // Footer copyright
    {
        id: "footer-text",
        tagName: "p",
        props: {
            sx: {
                color: "#666",
                fontSize: "0.875rem",
                margin: 0
            }
        },
        parent: "footer-content",
        content: `© ${new Date().getFullYear()} My Company. All rights reserved.`,
        order: 0,
        visible: true
    },

    // Footer links
    {
        id: "footer-links",
        tagName: "div",
        props: {
            sx: {
                display: "flex",
                gap: "20px"
            }
        },
        parent: "footer-content",
        order: 1,
        visible: true
    },
    {
        id: "footer-link-privacy",
        content: "Privacy Policy",
        tagName: "a",
        props: {
            href: "#",
            sx: {
                color: "#666",
                textDecoration: "none",
                fontSize: "0.875rem",
                "&:hover": { color: "#1976d2" }
            }
        },
        parent: "footer-links",
        order: 0,
        visible: true
    },
    {
        id: "footer-link-terms",
        tagName: "a",
        props: {
            href: "#",
            sx: {
                color: "#666",
                textDecoration: "none",
                fontSize: "0.875rem",
                "&:hover": { color: "#1976d2" }
            }
        },
        content: "Terms of Service",
        parent: "footer-links",
        order: 1,
        visible: true
    }
];