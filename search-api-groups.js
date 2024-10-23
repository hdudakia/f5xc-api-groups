const axios = require('axios');
const readline = require('readline');
require('colors'); // Load colors library

// Emojis for various stages
const tenantEmoji = '🏢';
const tokenEmoji = '🔑';
const searchEmoji = '🔍';
const groupEmoji = '📁';
const roleEmoji = '🧑‍💼';
const successEmoji = '✅';
const arrowEmoji = '➡️';

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user input
function promptQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Function to make API requests
async function request(tenant, token, api, method, data = '') {
  const url = `https://${tenant}.console.ves.volterra.io/api${api}`;
  const config = {
    headers: { Authorization: `APIToken ${token}` },
    method,
    url,
    data
  };
  return axios(config);
}

// Get API group elements based on search string(s) input
async function getApiGroupElements(tenant, token, searchList) {
  console.log(`\n${searchEmoji} Searching for API Group Elements that match your criteria: '${searchList.join(', ')}'...\n`.blue);

  const response = await request(tenant, token, "/web/namespaces/system/api_group_elements?report_fields", "get");
  const elementsMatch = [];

  response.data.items.forEach(item => {
    searchList.forEach(searchTerm => {
      if (item.get_spec.path_regex.includes(searchTerm)) {
        elementsMatch.push(item.name);
        console.log(`${arrowEmoji} Searched for '${searchTerm}' and matched: ${item.get_spec.path_regex} [name: ${item.name}]`.green);
      }
    });
  });

  return [...new Set(elementsMatch)].sort();
}

// Get API Groups containing the matched elements
async function getApiGroups(tenant, token, elementsMatch) {
  const gresponse = await request(tenant, token, "/web/namespaces/system/api_groups?report_fields", "get");
  const groupsMatch = [];

  // Loop through each group in the response
  gresponse.data.items.forEach(group => {
    const elementNames = group.get_spec.elements.map(element => element.name); // Extract element names

    // Check if any elements match the search criteria
    const matchingElements = elementsMatch.filter(match => elementNames.includes(match));

    // If there are matching elements, log the group details
    if (matchingElements.length > 0) {
      groupsMatch.push({ name: group.name, elements: elementNames, count: matchingElements.length });
    }
  });

  // If no matches found
  if (groupsMatch.length === 0) {
    console.log("No matching API groups found.".red);
  }

  return groupsMatch; // Return groupsMatch directly
}

// Get roles that contain the matched API Groups
async function getRoles(tenant, token, groupsMatch) {
  console.log(`\n${roleEmoji} Searching Roles...\n`.blue); // Keep this line to indicate searching for roles
  const rolesMatch = new Set();

  const rresponse = await request(tenant, token, "/web/custom/namespaces/system/roles", "get");

  rresponse.data.items.forEach(role => {
    role.api_groups.forEach(group => {
      if (groupsMatch.map(g => g.name).includes(group)) {
        rolesMatch.add(role.name);
      }
    });
  });

  // Display the count of matching roles
  console.log(`${successEmoji} Found ${rolesMatch.size} matching roles based on your search criteria:\n`.blue); // Remove extra line

  // Display the unique roles
  rolesMatch.forEach(role => console.log(`🔹 Role: ${role}`.cyan));

  return [...rolesMatch].sort();
}

// Function to handle group expansion with user selection
async function expandGroups(groups) {
  const viewAllInput = await promptQuestion('Do you want to see the elements of all groups at once? (yes/no): ');
  if (viewAllInput.toLowerCase() === 'yes') {
    groups.forEach(async group => {
      console.log(`\nExpanded View for ${group.name.green}:`);
      const elements = group.elements;
      console.log(`- ${elements.join('\n- ').green}`); // Display all elements in green
    });
  } else {
    const specificGroupsInput = await promptQuestion('Would you like to see elements of specific groups? (yes/no): ');
    if (specificGroupsInput.toLowerCase() === 'yes') {
      console.log("\nSelect the groups you want to view elements for (comma-separated indices):");
      groups.forEach((group, index) => {
        console.log(`${(index + 1).toString().green}: ${group.name.green}`);
      });

      const selectedIndices = await promptQuestion('Enter indices: ');
      const indicesArray = selectedIndices.split(',').map(num => parseInt(num.trim()) - 1);

      for (const index of indicesArray) {
        if (index >= 0 && index < groups.length) {
          const group = groups[index];
          console.log(`\nElement list for ${group.name.green}:`);
          const elements = group.elements;
          console.log(`Elements: ${elements.length.toString().red}`); // Display total elements in red
          console.log(`- ${elements.join('\n- ').green}`); // Display all elements in green
        } else {
          console.log(`Index ${index + 1} is out of range.`.red);
        }
      }
    }
  }

  // After viewing groups, ask the user if they're ready to see the roles
  await promptQuestion('Press Enter when you are ready to continue to the roles search...');
}

// Function to log matching API groups
function logMatchingApiGroups(groups) {
  console.log('📁 Searching API Groups...\n');
  groups.forEach(group => {
    console.log(`➡️ Matching API Group found: ${group.name.green} (Elements: ${group.elements.length.toString().red})`);
  });
}

// Main function to execute the steps
(async function main() {
  try {
    const tenant = await promptQuestion(`${tenantEmoji} F5XC Tenant: `) || "<my-tenant>";

    // Provide information about setting the token via an environment variable
    console.log(`\n🔑 You can provide your F5XC Token either by entering it directly or by setting the environment variable 'F5XC_TOKEN'.`);

    // Check if the environment variable is set; if so, display a message
    const tokenEnv = process.env.F5XC_TOKEN;
    let token;
    if (tokenEnv) {
      console.log(`${successEmoji} Found environment variable 'F5XC_TOKEN'. Using it for authentication.`.green);
      token = tokenEnv;
    } else {
      token = await promptQuestion(`${tokenEmoji} F5XC Token: `) || "<my-token>";
    }

    const searchInput = await promptQuestion(`${searchEmoji} Enter search criteria (comma-separated for multiple): `) || "purge";
    const searchList = searchInput.split(',').map(item => item.trim());

    const elementsMatch = await getApiGroupElements(tenant, token, searchList);
    const groupsMatch = await getApiGroups(tenant, token, elementsMatch);

    // Log matching API groups only once
    if (groupsMatch.length > 0) {
      logMatchingApiGroups(groupsMatch); // Log only if there are matches
    }

    // Expand groups
    if (groupsMatch.length > 0) {
      await expandGroups(groupsMatch);
    }

    await getRoles(tenant, token, groupsMatch);
  } catch (error) {
    console.error('❌ Error: '.red, error.message.red);
  } finally {
    rl.close(); // Close the readline interface
  }
})();
