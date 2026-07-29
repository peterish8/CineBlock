---
name: google-json-style-detailed
description: Comprehensive Google JSON style rules with section-level guidance. Use when google-json-style is insufficient, for thorough reviews, or when the user names this skill.
disable-model-invocation: true
---

# Google JSON Style (Detailed)

Source: [https://google.github.io/styleguide/jsoncstyleguide.html](https://google.github.io/styleguide/jsoncstyleguide.html)

Pair with the quick reference: [google-json-style](../google-json-style/SKILL.md)

This skill expands the short skill with section-level rules from Google's guide.
For authoritative full text, see the official URL and [reference.md](reference.md).

## How to use

1. Start from [google-json-style](../google-json-style/SKILL.md) for everyday edits
2. Use this skill for reviews, ambiguous cases, or API/doc conventions
3. Consult [reference.md](reference.md) for source paths and supplemental docs

## Section rules

### Important Note: Display Hidden Details in this Guide

- This style guide contains many details that are initially hidden from view. They are marked by the triangle icon, which you see here on your left. Click it now. You should see "Hooray" appear below.
### General Guidelines: Comments

- No comments in JSON objects.
### General Guidelines: Flattened data vs Structured Hierarchy

- Data should not be arbitrarily grouped for convenience.
### Property Name Guidelines: Property Name Format

- Choose meaningful property names.
### Property Name Guidelines: Key Names in JSON Maps

- JSON maps can use any Unicode character in key names.
### Property Name Guidelines: Reserved Property Names

- Certain property names are reserved for consistent use across services.
### Property Name Guidelines: Singular vs Plural Property Names

- Array types should have plural property names. All other property names should be singular.
### Property Name Guidelines: Naming Conflicts

- Avoid naming conflicts by choosing a new property name or versioning the API.
### Property Value Guidelines: Property Value Format

- Property values must be booleans, numbers, Unicode strings, objects, arrays, or null.
### Property Value Guidelines: Empty/Null Property Values

- Consider removing empty or null values.
### Property Value Guidelines: Enum Values

- Enum values should be represented as strings.
### Property Value Data Types: Date Property Values

- Dates should be formatted as recommended by RFC 3339.
### Property Value Data Types: Time Duration Property Values

- Time durations should be formatted as recommended by ISO 8601.
### Property Value Data Types: Latitude/Longitude Property Values

- Latitudes/Longitudes should be formatted as recommended by ISO 6709.
### Top-Level Reserved Property Names: apiVersion

- Property Value Type: string Parent: -
### Top-Level Reserved Property Names: context

- Property Value Type: string Parent: -
### Top-Level Reserved Property Names: id

- Property Value Type: string Parent: -
### Top-Level Reserved Property Names: method

- Property Value Type: string Parent: -
### Top-Level Reserved Property Names: params

- Property Value Type: object Parent: -
### Top-Level Reserved Property Names: data

- Property Value Type: object Parent: -
### Top-Level Reserved Property Names: error

- Property Value Type: object Parent: -
### Reserved Property Names in the data object: data.kind

- Property Value Type: string Parent: data
### Reserved Property Names in the data object: data.fields

- Property Value Type: string Parent: data
### Reserved Property Names in the data object: data.etag

- Property Value Type: string Parent: data
### Reserved Property Names in the data object: data.id

- Property Value Type: string Parent: data
### Reserved Property Names in the data object: data.lang

- Property Value Type: string (formatted as specified in BCP 47) Parent: data (or any child element)
### Reserved Property Names in the data object: data.updated

- Property Value Type: string (formatted as specified in RFC 3339) Parent: data
### Reserved Property Names in the data object: data.deleted

- Property Value Type: boolean Parent: data (or any child element)
### Reserved Property Names in the data object: data.items

- Property Value Type: array Parent: data
### Reserved Property Names for Paging: data.currentItemCount

- Property Value Type: integer Parent: data
### Reserved Property Names for Paging: data.itemsPerPage

- Property Value Type: integer Parent: data
### Reserved Property Names for Paging: data.startIndex

- Property Value Type: integer Parent: data
### Reserved Property Names for Paging: data.totalItems

- Property Value Type: integer Parent: data
### Reserved Property Names for Paging: data.pagingLinkTemplate

- Property Value Type: string Parent: data
### Reserved Property Names for Paging: data.pageIndex

- Property Value Type: integer Parent: data
