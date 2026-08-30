export function TrustList({ items }: Readonly<{ items: readonly string[] }>) {
  return (
    <ul className="trust-list">
      {items.map((item) => (
        <li key={item} className="trust-chip">
          {item}
        </li>
      ))}
    </ul>
  );
}
