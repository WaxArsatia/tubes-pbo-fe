/**
 * Admin Layout
 * Layout for admin pages with role-based navigation
 * Based on docs/06_ADMIN_FRONTEND.md
 */

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useSessionManagement } from "@/hooks/use-session-management";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { handleLogout } from "@/lib/logout";

export default function AdminLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const router = useRouter();
	const pathname = usePathname();
	const { user, isAuthenticated } = useAuth();

	// Session management with automatic token expiry checks
	useSessionManagement();

	// Check admin access
	useEffect(() => {
		if (!isAuthenticated) {
			router.push("/login");
		} else if (user?.role !== "ADMIN") {
			router.push("/dashboard");
		}
	}, [isAuthenticated, user, router]);

	// Don't render if not authenticated or not admin
	if (!isAuthenticated || user?.role !== "ADMIN") {
		return null;
	}

	const navItems = [
		{ href: "/admin/dashboard", label: "Dashboard" },
		{ href: "/admin/users", label: "User Management" },
		{ href: "/admin/activity", label: "Activity Log" },
	];

	return (
		<div className="min-h-screen bg-background">
			{/* Navigation Bar */}
			<header className="sticky top-0 z-50 w-full border-b border-border bg-card">
				<div className="container flex items-center justify-between h-16 px-4 mx-auto">
					{/* Logo & Title */}
					<div className="flex items-center space-x-4">
						<Link
							href="/admin/dashboard"
							className="flex items-center space-x-2"
						>
							<span className="text-xl font-bold text-foreground">
								PDF Quiz Admin
							</span>
						</Link>
						<Badge variant="destructive">ADMIN</Badge>
					</div>

					{/* Navigation Links */}
					<nav className="items-center hidden space-x-6 md:flex">
						{navItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className={`text-sm font-medium transition-colors hover:text-primary ${
									pathname === item.href
										? "text-foreground"
										: "text-muted-foreground"
								}`}
							>
								{item.label}
							</Link>
						))}
					</nav>

					{/* User Menu */}
					<DropdownMenu>
						<DropdownMenuTrigger>
							<Button variant="ghost" className="text-sm">
								{user.name}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							<div className="px-2 py-1.5">
								<p className="text-sm font-medium text-foreground">
									{user.name}
								</p>
								<p className="text-xs text-muted-foreground">{user.email}</p>
							</div>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={() => router.push("/dashboard")}>
								User Dashboard
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => router.push("/settings")}>
								Settings
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={() => void handleLogout()}>
								Logout
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</header>

			{/* Mobile Navigation */}
			<nav className="border-b border-border bg-card md:hidden">
				<div className="container px-4 py-3 mx-auto">
					<div className="flex space-x-4 overflow-x-auto">
						{navItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className={`whitespace-nowrap text-sm font-medium transition-colors hover:text-primary ${
									pathname === item.href
										? "text-foreground"
										: "text-muted-foreground"
								}`}
							>
								{item.label}
							</Link>
						))}
					</div>
				</div>
			</nav>

			<Separator />

			{/* Main Content */}
			<main className="container py-6 mx-auto">{children}</main>

			{/* Footer */}
			<footer className="py-6 mt-auto border-t border-border bg-card">
				<div className="container px-4 mx-auto text-center">
					<p className="text-sm text-muted-foreground">
						© 2026 PDF Quiz Platform - Admin Panel
					</p>
				</div>
			</footer>
		</div>
	);
}
