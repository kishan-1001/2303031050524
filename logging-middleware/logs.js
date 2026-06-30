export async function Log(stack, level, packageName, message) {
    await axios.post(LOG_API, {
        stack,
        level,
        package: packageName,
        message
    });
}