export function TrustList({ items }: { items: readonly string[] }) {
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
