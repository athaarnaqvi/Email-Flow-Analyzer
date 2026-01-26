# Email Flow Analyzer UI

A web-based user interface for analyzing email flow data.  
Built using **Next.js** and **Node.js**, designed to work with backend services such as OpenSearch.

---

## Prerequisites

Before running this project, make sure you have the following installed on your system:

### 1. Node.js
- **Version:** 18.x or higher
- Verify installation:
  ```bash
  node -v
  ```
- Download Node.js from the official website: [https://nodejs.org/](https://nodejs.org/)

Installing Node.js also installs npm automatically.


## Getting Started

Follow these steps to run the application locally.

1. **Clone the repository**
   ```bash
   git clone https://github.com/athaarnaqvi/Email-Flow-Analyzer.git
   cd email-flow-analyzer-ui
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Run the development server**
   ```bash
   pnpm run dev
   ```

4. **Open in browser**
   Once the server starts, open your browser and navigate to:  
   [http://localhost:3000](http://localhost:3000)

### Notes
- Do not commit `node_modules` or `.next` directories.
- Configuration files such as `package.json`, `pnpm-lock.yaml`, and `tsconfig.json` are version-controlled.
- This project uses Next.js default development settings.

---

## Scripts

Common pnpm scripts used in this project:

- `pnpm run dev` – Start development server
- `pnpm run build` – Build for production
- `pnpm run start` – Start production server

---

## License

This project is currently not licensed.

