async function fetchSolution() {
    try {
        const response = await fetch("YOUR_CLOUD_FUNCTION_URL/solution");
        const data = await response.json();
        if (data.error) {
            console.error("Error:", data.error);
        } else {
            console.log("Puzzle Solution:", data.solution);
        }
    } catch (error) {
        console.error("Failed to fetch solution:", error);
    }
}

fetchSolution();
