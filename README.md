# F5XC API Group Search Tool

## Use Case

The F5XC API Group Search Tool is designed to interact with the F5XC API to search for API group elements, their corresponding groups, and roles based on user-defined criteria. This tool is especially useful for administrators and developers who need to manage and audit API access within their F5XC tenant.

## Features

- Search for API group elements based on keywords.
- Retrieve and display matching API groups.
- Fetch and list roles associated with the found API groups.
- Interactive command-line interface for ease of use.

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v12 or higher recommended)
- npm (Node package manager, usually comes with Node.js)

### Steps to Install

1. Clone the repository:

   ```bash
   git clone https://github.com/hdudakia/f5xc-api-groups.git
   cd f5xc-api-groups
   ```

2. Install the required packages:

    ```bash
    npm install axios colors
    ```

## Usage

1. Ensure you have your F5XC Tenant and API Token ready.

2. Set the environment variable for your API token, if desired:

    ```bash
    export F5XC_TOKEN=<your-token>
    ```

3. Run the script:

    ```bash
    node search-api-groups.js
    ```


4. Follow the prompts in the command line interface to input your tenant, token, and search criteria. You will be prompted to:

- Enter your F5XC Tenant. (If your tenant URL is `https://acmecorp.console.ves.volterra.io/`, then tenant name for input will be `acmecorp`)
- Provide your F5XC Token (or use the environment variable).
- Input search criteria (comma-separated if multiple).
- View elements of matching groups or search for roles.


## Packages Used

- **axios**: For making HTTP requests to the F5XC API.
- **colors**: For adding color to console output to improve readability.
- **readline**: Built-in module for reading input from the command line.
