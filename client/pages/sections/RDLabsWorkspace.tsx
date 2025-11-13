export default function RDLabsWorkspace() {
  console.log("RDLabsWorkspace is rendering");

  return (
    <div className="w-full h-full flex items-center justify-center bg-yellow-400" style={{ minHeight: "500px" }}>
      <div className="text-center">
        <p className="text-4xl font-bold text-black">YELLOW TEST - RDLABS</p>
        <p className="text-xl text-black mt-4">If you see yellow here, RDLabsWorkspace is rendering!</p>
      </div>
    </div>
  );
}
