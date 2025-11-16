import "./globals.css";
import { Athiti } from "next/font/google";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Golfgun",
	description: "Golfgun web app",
	icons: {
		icon: [
			{ url: "/golfgun-16.png", sizes: "16x16", type: "image/png" },
			{ url: "/golfgun-32.png", sizes: "32x32", type: "image/png" },
			{ url: "/golfgun-192.png", sizes: "192x192", type: "image/png" },
			{ url: "/golfgun-512.png", sizes: "512x512", type: "image/png" },
		],
		apple: [
			{ url: "/golfgun-180.png", sizes: "180x180", type: "image/png" },
		],
	},
	openGraph: {
		title: "Golfgun",
		description: "Golfgun web app",
		images: [{ url: "/golfgun-512.png", width: 512, height: 512 }],
	},
	twitter: {
		card: "summary",
		title: "Golfgun",
		description: "Golfgun web app",
		images: ["/golfgun-512.png"],
	},
};

const athiti = Athiti({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	display: "swap",
});

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className={athiti.className}>
			<body>{children}</body>
		</html>
	);
}
