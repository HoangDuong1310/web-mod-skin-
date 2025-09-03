applyTo: '**'
---
# 🧠 Project-Wide AI Instructions

## 🔧 General Principles

All AI-generated code and behavior must follow strict professional software development standards, including:

---

### 🚀 Mandatory MCP Usage

1. Always use the following Modular Cognitive Processes (MCPs):

   - `thinking`:  
     Use for all planning, reasoning, and decomposition of complex problems before coding.

   - `serena`:  
     Use for all reading, scanning, and search-related operations (e.g., analyzing code, locating logic, summarizing context).  
     ⚡ Optimized for **speed** and **low token usage**.

---

## 📐 Naming Conventions

- **Always follow the project’s naming conventions.**
- Do **not invent your own naming patterns**.
- Before introducing any new variable, file, folder, function, or component name:
  - Check existing patterns in the codebase.
  - Match **casing, prefixes, suffixes, and structure** exactly.
- Be consistent with pluralization, abbreviations, and module naming.

---

## 🎨 Styling & Asset Management

- **All CSS, SCSS, or styling logic must be placed in their appropriate folders.**
- Never inline style unless explicitly allowed by the project rules.
- File locations must reflect their purpose:
  - Styles → `styles/`, `css/`, or similar
  - Icons → `assets/icons/`
  - Images → `assets/images/`
  - Helper classes → `utils/` or `helpers/`

➡️ **Do not mix styling with logic or markup** in the same file unless following a strict component style pattern (e.g., CSS Modules in Next.js).

---

## 🧩 Separation of Concerns

- Keep files focused:
  - **One responsibility per file** (e.g., UI, logic, helper).
  - Do **not combine** logic, styling, and utilities in a single file.
  - Helper functions must be extracted into appropriate utility files.

---

## 📁 Folder & File Structure

- **Respect the current folder structure**.
- Place files exactly where similar ones already exist.
- Never create new folders or move files unless explicitly required.
- Avoid dumping everything into a single file or folder.

---

## 🧠 Problem Solving Workflow

- Understand the problem clearly.
- Break it down into smaller tasks.
- Plan a clean, modular solution.
- Communicate reasoning if needed.
- Implement only after having a clear approach.

---

## ⚙️ Code Quality & Optimization

- Write clean, lean, efficient code.
- Avoid duplication, excessive nesting, and unused declarations.
- Prefer readability over cleverness.
- Optimize for performance and maintainability.

---

## 🧱 Code Style

- Use descriptive, semantic names.
- Follow existing indentation, formatting, and commenting standards.
- Keep functions and components small and modular.
- Avoid unnecessary complexity.

---

## 🚫 Do Not

- ❌ Do not delete and recreate files without reason.
- ❌ Do not ignore naming rules or folder organization.
- ❌ Do not include assets or features (like icons, styles) without proper placement.
- ❌ Do not inline things that should be separated (styles, helpers, logic).

---

## 🧭 AI Behavior Summary

Behave like a seasoned software engineer:
- Structured thinking
- Clean implementation
- Respect for collaboration and team patterns
- Output must look like it was written by a human expert

---

## 🎓 Purpose of This File

This file exists to guide AI to:

- Think before coding  
- Act with professionalism  
- Align 100% with project expectations  
- Deliver code that’s production-ready, readable, and trusted by the team

---
