# Personal Finance Web Application

## Overview

I built this personal finance management application to help me track my income, expenses, and financial accounts in one centralized platform. The application provides real-time insights into my financial health through interactive dashboards and analytics.

I initially developed this project using vanilla JavaScript, but as the application grew in complexity, I encountered several errors and limitations. The lack of type safety made it difficult to catch bugs early, and maintaining the codebase became increasingly challenging. I decided to refactor the entire application using React and TypeScript, which has significantly improved code quality, maintainability, and developer experience.

## What I Built

This is a full-stack web application that allows me to manage multiple financial accounts, track transactions, and visualize my spending patterns. I designed it with a mobile-first approach, ensuring that I can manage my finances on any device. The application uses modern web technologies to provide a fast, responsive, and type-safe experience.

## Technology Stack

I chose React 18 with TypeScript as the foundation for this project because I wanted full type safety and a component-based architecture. For styling, I used Tailwind CSS to create a clean, modern interface that adapts seamlessly to different screen sizes.

The backend runs on Supabase, which provides me with a PostgreSQL database, authentication, and real-time subscriptions. I integrated Google OAuth for secure, passwordless authentication. For state management, I use TanStack Query to handle server state and caching, which significantly improves the application's performance.

I configured the application as a Progressive Web App using the Vite PWA plugin, allowing me to install it on my devices and use it offline. For data visualization, I integrated Recharts to display spending trends and category breakdowns.

## Core Features

The application includes several key features that I use daily. The authentication system uses Google OAuth, making it simple and secure to log in from any device. Once authenticated, I can create and manage multiple financial accounts, such as bank accounts, credit cards, and cash wallets. Each account can be configured with its own currency.

The transaction management system allows me to record both income and expenses. I can categorize each transaction, add detailed descriptions, and specify the date. The application automatically updates account balances as I add or modify transactions.

I implemented a real-time currency conversion feature that uses exchange rate APIs to convert amounts between different currencies. This is particularly useful since I track accounts in multiple currencies. The application caches exchange rates to improve performance and reduce API calls.

The dashboard provides me with an at-a-glance view of my financial situation. I can see my total balance across all accounts, recent transactions, and spending trends. The analytics page breaks down my expenses by category and shows trends over time using interactive charts.

I also built a settings page where I can customize my preferences, including my preferred display currency and whether to show or hide account balances. These preferences are stored in the database and persist across sessions.

## Project Architecture

I organized the codebase with a clear separation of concerns. The components directory contains all React components, organized by feature. I have separate directories for UI primitives, layout components, authentication flows, account management, transaction handling, dashboard widgets, and analytics visualizations.

Custom React hooks are centralized in the hooks directory. These hooks encapsulate business logic for authentication, data fetching, and state management. The lib directory contains utility functions and client configurations, including the Supabase client setup and validation schemas.

Type definitions are stored in the types directory, where I define interfaces for accounts, transactions, user preferences, and currency data. I also created a comprehensive database type definition that matches my Supabase schema, ensuring type safety when interacting with the database.

## Database Schema

The application uses four main tables in Supabase. The accounts table stores information about my financial accounts, including the account name, type, balance, currency, and optional banking details. The transactions table records all income and expense transactions, linking each transaction to a specific account.

The user_preferences table stores my personal settings, such as my preferred display currency and UI preferences. The currency_rates table caches exchange rate data to minimize API calls and improve performance.

I implemented Row Level Security policies on all tables to ensure that users can only access their own data. Each table includes triggers to automatically update timestamps when records are modified.

## Development Setup

To run this application locally, I need Node.js 18 or higher installed. After cloning the repository, I install dependencies using npm install. I created a .env file with my Supabase credentials, including the project URL and anonymous key.

The development server starts with npm run dev, which launches Vite on port 5173. For production builds, I run npm run build, which compiles TypeScript and bundles the application into the dist directory.

## Deployment

I deployed this application to Vercel, which automatically builds and deploys whenever I push changes to the main branch. In the Vercel dashboard, I configured environment variables for my Supabase credentials. I also updated the Supabase authentication settings to include my Vercel domain in the allowed redirect URLs.

The application is fully functional in production, with Google OAuth working correctly and all features available.

## Challenges and Solutions

During development, I encountered several challenges. One major issue was configuring OAuth redirects to work correctly in both development and production environments. I solved this by implementing environment detection in the authentication flow, which automatically uses localhost for development and the production URL when deployed.

Another challenge was ensuring type safety throughout the application. I created a comprehensive database types file that mirrors my Supabase schema, which eliminated type errors when performing database operations.

I also had to address Supabase security warnings. I enabled Row Level Security on all tables, set immutable search paths on database functions, and enabled leaked password protection to follow security best practices.

## Future Enhancements

I plan to add several features in the future. These include budget tracking and alerts, recurring transaction support, data export functionality, transaction search and advanced filtering, and detailed financial reports. I also want to implement data visualization improvements and possibly add support for connecting to bank APIs for automatic transaction imports.

## Conclusion

This personal finance application has become an essential tool for managing my finances. It provides me with clear insights into my spending habits and helps me maintain better control over my financial health. The modern tech stack ensures that the application is fast, reliable, and maintainable as I continue to add new features.
