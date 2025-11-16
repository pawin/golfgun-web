import "./globals.css";
import { Athiti } from "next/font/google";

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
