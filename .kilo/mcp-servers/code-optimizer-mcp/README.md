# Code Optimizer MCP Server

A Model Context Protocol (MCP) server that provides intelligent code optimization suggestions for better performance, readability, and maintainability.

## Features

- **Code Analysis**: Analyze code for optimization opportunities across multiple dimensions
- **Smart Suggestions**: Get actionable recommendations for improvement
- **Auto-optimization**: Apply safe optimizations automatically
- **Multi-language Support**: JavaScript, TypeScript, Python, Java, C++, C#, Go, Rust

## Usage

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "code-optimizer": {
      "command": "node",
      "args": ["/path/to/code-optimizer-mcp/index.js"]
    }
  }
}
```

### Available Tools

#### 1. analyze_code
Analyze code for optimization opportunities

**Input:**
- `filePath` (optional): Path to code file
- `code` (optional): Raw code string
- `language`: Programming language
- `focusAreas` (optional): Array of focus areas

**Focus Areas:**
- `performance`: Performance optimizations
- `readability`: Code readability improvements
- `maintainability`: Code maintainability enhancements
- `security`: Security vulnerability detection
- `best-practices`: Best practice recommendations

**Example:**
```json
{
  "filePath": "src/components/Button.tsx",
  "language": "typescript",
  "focusAreas": ["performance", "readability"]
}
```

#### 2. optimize_code
Apply code optimizations

**Input:**
- `filePath`: Path to file to optimize
- `optimizations`: Array of optimizations to apply
- `autoApply` (optional): Auto-apply safe optimizations (default: false)

**Example:**
```json
{
  "filePath": "src/utils/helpers.js",
  "optimizations": [
    {
      "type": "performance",
      "target": "processData",
      "suggestion": "Use memoization for repeated calculations"
    }
  ],
  "autoApply": false
}
```

#### 3. get_optimization_report
Generate comprehensive optimization report

**Input:**
- `filePath`: Path to code file
- `format` (optional): Output format (text, json, markdown)

**Example:**
```json
{
  "filePath": "src/index.js",
  "format": "markdown"
}
```

## Output Formats

### Score
Optimization score from 0-100 (higher is better)

### Metrics
- **Lines**: Total lines of code
- **Complexity**: Cyclomatic complexity score
- **Duplication**: Code duplication instances

### Issues
Categorized by severity:
- **Critical**: Security vulnerabilities, critical bugs
- **High**: Major performance issues
- **Medium**: Moderate improvements needed
- **Low**: Minor improvements, style issues

## Installation

```bash
cd .kilo/mcp-servers/code-optimizer-mcp
npm install
```

## Running

```bash
node index.js
```

## Architecture

The optimizer uses pattern-matching and heuristic analysis to identify:

1. **Performance Issues**
   - Nested loops
   - Multiple array iterations
   - Sequential async operations
   - Variable declaration issues

2. **Readability Issues**
   - Long lines (>120 chars)
   - Long functions (>50 lines)
   - Complex expressions

3. **Maintainability Issues**
   - Missing documentation
   - Long identifiers
   - Code complexity

4. **Security Issues**
   - Dangerous functions (eval)
   - XSS vulnerabilities
   - Unsafe patterns

## Integration with Kilo

This MCP server integrates with the Kilo CLI to provide:
- Pre-commit optimization checks
- Code review suggestions
- Automated refactoring
- Continuous improvement workflows

## Example Workflows

### 1. Pre-commit Check
```bash
# Analyze staged files
claude analyze_code --file src/component.js --focus performance,readability
```

### 2. Code Review
```bash
# Generate optimization report
claude get_optimization_report src/api.js --format markdown
```

### 3. Batch Optimization
```bash
# Apply safe optimizations
claude optimize_code --file src/utils.js --auto-apply
```

## Customization

Extend the optimizer by modifying `optimizer.js`:
- Add language-specific patterns
- Customize severity levels
- Create new optimization types
- Implement custom auto-fixes

## License

MIT
