export async function retryPrisma(fn, retries = 3, delay = 500) {
  let attempt = 0;

  while (attempt < retries) {
    try {
      return await fn(); 
    } catch (err) {
      if (err.code === "P2024" || err.code === "P1001") {
        attempt++;
        const backoff = delay * 2 ** (attempt - 1); 
        console.warn(` Prisma query failed (attempt ${attempt}), retrying in ${backoff}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoff));
      } else {
        throw err; 
      }
    }
  }

  throw new Error(" Prisma query failed after all retries");
}
