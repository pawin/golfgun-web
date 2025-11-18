import "./globals.css";
import { Athiti } from "next/font/google";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "GolfGun!",
	description: "Golfgun web app",
	icons: {
		icon: [{ url: "/golfgun-32.png", type: "image/png" }],
		apple: [
			{ url: "/golfgun-180.png", sizes: "180x180", type: "image/png" },
		],
	}
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
