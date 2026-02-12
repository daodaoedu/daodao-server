# Learning Resources Collector - Implementation Plan

## Goal
Build a CLI script that collects learning resources from YouTube, GitHub, and Threads,
then outputs them as CSV matching the `resources` table format.

## CSV Output Columns (matching resource schema)

| Column | Source | Description |
|--------|--------|-------------|
| `name` | API | Resource title (max 255 chars) |
| `url` | API | Link to the resource |
| `image_url` | API | Thumbnail/preview image |
| `description` | API | Resource description |
| `video_url` | API | Video link (YouTube only) |
| `type` | Mapped | One of: `video_content`, `books_articles`, `community_organization`, `learning_tools`, `other` |
| `cost` | Inferred | `free` / `paid` / `partial_free` |
| `level` | Default | `all_levels` (can be overridden) |
| `tags` | Derived | Comma-separated tags from platform metadata |
| `source_platform` | Collector | `youtube` / `github` / `threads` |

## Platform Collectors

### 1. YouTube (YouTube Data API v3)
- **Search strategy**: Query keywords like "programming tutorial", "學習", "線上課程", etc.
- **Data extracted**: title, videoId, description, thumbnails, channelTitle, tags
- **Resource type mapping**: `video_content`
- **Cost**: Default `free` (YouTube is generally free)
- **Requires**: `YOUTUBE_API_KEY` environment variable

### 2. GitHub (GitHub Search API)
- **Search strategy**: Search repos with topics like `awesome-list`, `tutorial`, `learning-resources`, `education`
- **Data extracted**: full_name, html_url, description, topics, stargazers_count, language
- **Resource type mapping**: `books_articles` for awesome-lists, `learning_tools` for tools, `other` for repos
- **Cost**: Default `free`
- **Requires**: `GITHUB_TOKEN` (optional, increases rate limit)

### 3. Threads (Threads API)
- **Note**: Threads API is primarily for content publishing, not search.
- **Alternative approach**: Use keyword-based search via web or curated hashtag lists
- **Data extracted**: post text, media URLs, author
- **Resource type mapping**: `other` or `community_organization`
- **Requires**: `THREADS_ACCESS_TOKEN`

## File Structure

```
scripts/collect-learning-resources/
  index.ts                    # CLI entry point
  config.ts                   # Search keywords, API config
  types.ts                    # CollectedResource interface
  collectors/
    youtube.collector.ts      # YouTube Data API v3
    github.collector.ts       # GitHub Search API
    threads.collector.ts      # Threads API
  utils/
    resource-mapper.ts        # Raw data → resource format
    csv-writer.ts             # Write CSV output
```

## Usage

```bash
# Run all collectors
npx tsx scripts/collect-learning-resources/index.ts

# Run specific collector
npx tsx scripts/collect-learning-resources/index.ts --platform youtube

# Custom search keywords
npx tsx scripts/collect-learning-resources/index.ts --keywords "React,TypeScript,學習"

# Custom output file
npx tsx scripts/collect-learning-resources/index.ts --output ./data/resources.csv
```

## Dependencies
- `csv-writer` - CSV file generation (or use built-in approach to avoid new deps)
- `commander` - CLI argument parsing (optional, can use process.argv)
- No new dependencies needed if we use native fetch (Node 18+) and manual CSV generation

## Implementation Steps

1. Create types and config
2. Implement YouTube collector
3. Implement GitHub collector
4. Implement Threads collector
5. Build resource mapper (normalize platform data → resource format)
6. Build CSV writer
7. Wire up CLI entry point with argument parsing
