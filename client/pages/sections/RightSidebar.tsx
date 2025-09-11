import React, { useEffect, useState } from "react";
import React, { useEffect, useState } from "react";
import { Plus, Minus, Send, Palette } from "lucide-react";

interface RightSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  selectedAllergens: string[];
  onAllergensChange: (allergens: string[]) => void;
  selectedNationality: string[];
  onNationalityChange: (nationality: string[]) => void;
  selectedCourses: string[];
  onCoursesChange: (courses: string[]) => void;
  selectedRecipeType: string[];
  onRecipeTypeChange: (recipeType: string[]) => void;
  selectedPrepMethod: string[];
  onPrepMethodChange: (prepMethod: string[]) => void;
  selectedCookingEquipment: string[];
  onCookingEquipmentChange: (cookingEquipment: string[]) => void;
  selectedRecipeAccess: string[];
  onRecipeAccessChange: (recipeAccess: string[]) => void;
  image: string | null;
  onImageChange: (image: string | null) => void;
  onRecipeImport?: (recipeData: any) => void;
}

const allergenList = [
  "Corn","Dairy","Eggs","Fish","Gluten","Mustard",
  "Nuts","Peanuts","Sesame","Shellfish","Soy","Sulphites",
  "Celery","Lupin","Molluscs","Coconut","Tree Nuts","Wheat",
  "Barley","Oats","Rye","Spelt","Kamut","Triticale"
];

const nationalityList = [
  "Chinese","French","Greek","Indian","Italian","Japanese",
  "Korean","Mexican","Middle Eastern","Spanish","Thai","Vietnamese"
];

const coursesList = [
  "1st Course","2nd Course","3rd Course","Amuse","Dessert",
  "Entree","Entrement","Pastry","Salad","Side Component"
];

const recipeTypeList = ["Full Recipe","Sub Recipe"];

const prepMethodList = [
  "Bake","Fried","Grilled","Hearth","Poached","Roasted",
  "Rotisserie","Sauté","Smoker","Sous Vide","Tandori"
];

const cookingEquipmentList = [
  "Alto Sham","Blast Freezer","Cvap","Deck Oven","Rational","Sous Vide"
];

const recipeAccessList = ["Bar","Global","Grab & Go","Outlet","Pastry"];

export default function RightSidebar(props: RightSidebarProps) {
  const { isCollapsed, onAllergensChange, onNationalityChange, onCoursesChange, onRecipeTypeChange,
    onPrepMethodChange, onCookingEquipmentChange, onRecipeAccessChange, selectedAllergens, selectedNationality,
    selectedCourses, selectedRecipeType, selectedPrepMethod, selectedCookingEquipment, selectedRecipeAccess,
    image, onImageChange, onRecipeImport } = props;

  const [status, setStatus] = useState("active");
  const [recipeUrl, setRecipeUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [clipboardUrl, setClipboardUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const toggle = (arr: string[], set: (v: string[]) => void, item: string) =>
    set(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);

  useEffect(() => {
    const checkClipboard = async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text && /https?:\/\//.test(text)) setClipboardUrl(text);
      } catch {}
    };
    if (!isCollapsed) checkClipboard();
  }, [isCollapsed]);

  const handleUrlSubmit = async () => {
    if (!recipeUrl || isImporting) return;
    setIsImporting(true);
    try {
      const res = await fetch('/api/recipe/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: recipeUrl }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Import failed (${res.status})`);
      onRecipeImport?.(data);
      setRecipeUrl("");
    } catch (e: any) {
      alert(e?.message || 'Failed to import recipe');
    } finally { setIsImporting(false); }
  };

  return (
    <>
      <button
        aria-label="Toggle sidebar"
        onClick={props.onToggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-[71] bg-background border border-gray-300 rounded-l-full shadow px-2 py-3 hover:bg-muted"
        style={{ transform: 'translateY(-50%)' }}
      >
        <div className="flex flex-col items-center gap-1">
          <span className="block w-0.5 h-4 bg-gray-400"></span>
          <span className="block w-0.5 h-4 bg-gray-400"></span>
          <span className="block w-0.5 h-4 bg-gray-400"></span>
        </div>
      </button>
      <div className={`fixed top-16 right-0 z-[70] ${isCollapsed ? 'translate-x-full' : 'translate-x-0'} w-72 h-[80vh] bg-gradient-to-b from-gray-100/60 via-gray-200/50 to-gray-300/60 backdrop-blur-sm border-l border-t border-gray-400/50 rounded-tl-2xl rounded-bl-2xl shadow-inner transition-transform duration-500 ease-in-out overflow-hidden`}>
        {!isCollapsed && (
          <div className="flex flex-col h-full">
          <div className="p-4 pt-4 border-b border-gray-300/50">
            <div>
              <label className="block text-sm font-medium mb-1">Recipe URL</label>
              <div className="flex gap-1">
                <input className="flex-1 border border-gray-400/50 p-2 rounded-l bg-gray-100/50 backdrop-blur-sm focus:bg-white/80 transition-colors text-sm placeholder-gray-400" value={recipeUrl} onChange={(e)=>setRecipeUrl(e.target.value)} placeholder="Enter Recipe Url" />
                <button onClick={handleUrlSubmit} disabled={isImporting} className={`px-3 py-2 text-white rounded-r ${isImporting?'bg-gray-400':'bg-blue-500 hover:bg-blue-600'}`}>{isImporting? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send className="w-4 h-4"/>}</button>
              </div>
              {clipboardUrl && <div className="text-xs text-blue-600 mt-1">URL detected: {clipboardUrl.substring(0,30)}...</div>}
            </div>
          </div>

          <div className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
            <div>
              <label className="block text-sm font-medium mb-1">Recipe Image</label>
              <input type="file" onChange={(e)=>{ const f=e.target.files?.[0]; if (f) onImageChange(URL.createObjectURL(f)); }} className="w-full text-xs border border-gray-400/50 p-2 rounded bg-gray-100/50 backdrop-blur-sm focus:bg-white/80 transition-colors" />
              {image && (
                <div className="mt-2">
                  <img src={image} alt="Preview" className="w-full h-32 object-cover rounded border" />
                  <button className="w-full mt-2 px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-2" onClick={()=>{ const ev=new CustomEvent('openImageEditor',{detail:{image}}); window.dispatchEvent(ev); }}>
                    <Palette className="w-3 h-3" /> Edit Image
                  </button>
                </div>
              )}
            </div>

            <fieldset className="mt-3 rounded-lg border p-3 bg-red-50/80">
              <legend className="px-1 text-sm font-semibold text-red-700">Allergens ({selectedAllergens.length})</legend>
              <div className="max-h-32 overflow-y-auto pr-2 grid grid-cols-3 gap-1">
                {allergenList.map((a)=> (
                  <label key={a} className="flex items-center gap-1 text-xs cursor-pointer hover:bg-red-100/50 p-1 rounded">
                    <input type="checkbox" className="scale-75 text-red-600" checked={selectedAllergens.includes(a)} onChange={()=>toggle(selectedAllergens,onAllergensChange,a)} />
                    <span className="text-red-700">{a}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-3 rounded-lg border p-3 bg-blue-50/80">
              <legend className="px-1 text-sm font-semibold text-blue-700">Nationality ({selectedNationality.length})</legend>
              <div className="grid grid-cols-3 gap-1">
                {nationalityList.map((n)=> (
                  <label key={n} className="flex items-center gap-1 text-xs cursor-pointer hover:bg-blue-100/50 p-1 rounded">
                    <input type="checkbox" className="scale-75 text-blue-600" checked={selectedNationality.includes(n)} onChange={()=>toggle(selectedNationality,onNationalityChange,n)} />
                    <span className="text-blue-700">{n}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-3 rounded-lg border p-3 bg-blue-50/80">
              <legend className="px-1 text-sm font-semibold text-blue-700">Courses ({selectedCourses.length})</legend>
              <div className="grid grid-cols-3 gap-1">
                {coursesList.map((c)=> (
                  <label key={c} className="flex items-center gap-1 text-xs cursor-pointer hover:bg-blue-100/50 p-1 rounded">
                    <input type="checkbox" className="scale-75 text-blue-600" checked={selectedCourses.includes(c)} onChange={()=>toggle(selectedCourses,onCoursesChange,c)} />
                    <span className="text-blue-700">{c}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-3 rounded-lg border p-3 bg-blue-50/80">
              <legend className="px-1 text-sm font-semibold text-blue-700">Recipe Type ({selectedRecipeType.length})</legend>
              <div className="grid grid-cols-2 gap-1">
                {recipeTypeList.map((t)=> (
                  <label key={t} className="flex items-center gap-1 text-xs cursor-pointer hover:bg-blue-100/50 p-1 rounded">
                    <input type="checkbox" className="scale-75 text-blue-600" checked={selectedRecipeType.includes(t)} onChange={()=>toggle(selectedRecipeType,onRecipeTypeChange,t)} />
                    <span className="text-blue-700">{t}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-3 rounded-lg border p-3 bg-blue-50/80">
              <legend className="px-1 text-sm font-semibold text-blue-700">Preparation Method ({selectedPrepMethod.length})</legend>
              <div className="grid grid-cols-3 gap-1">
                {prepMethodList.map((m)=> (
                  <label key={m} className="flex items-center gap-1 text-xs cursor-pointer hover:bg-blue-100/50 p-1 rounded">
                    <input type="checkbox" className="scale-75 text-blue-600" checked={selectedPrepMethod.includes(m)} onChange={()=>toggle(selectedPrepMethod,onPrepMethodChange,m)} />
                    <span className="text-blue-700">{m}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-3 rounded-lg border p-3 bg-blue-50/80">
              <legend className="px-1 text-sm font-semibold text-blue-700">Cooking Equipment ({selectedCookingEquipment.length})</legend>
              <div className="grid grid-cols-3 gap-1">
                {cookingEquipmentList.map((m)=> (
                  <label key={m} className="flex items-center gap-1 text-xs cursor-pointer hover:bg-blue-100/50 p-1 rounded">
                    <input type="checkbox" className="scale-75 text-blue-600" checked={selectedCookingEquipment.includes(m)} onChange={()=>toggle(selectedCookingEquipment,onCookingEquipmentChange,m)} />
                    <span className="text-blue-700">{m}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-3 rounded-lg border p-3 bg-blue-50/80">
              <legend className="px-1 text-sm font-semibold text-blue-700">Recipe Access ({selectedRecipeAccess.length})</legend>
              <div className="grid grid-cols-3 gap-1">
                {recipeAccessList.map((m)=> (
                  <label key={m} className="flex items-center gap-1 text-xs cursor-pointer hover:bg-blue-100/50 p-1 rounded">
                    <input type="checkbox" className="scale-75 text-blue-600" checked={selectedRecipeAccess.includes(m)} onChange={()=>toggle(selectedRecipeAccess,onRecipeAccessChange,m)} />
                    <span className="text-blue-700">{m}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label className="block text-sm font-medium mb-1">Internal Notes</label>
              <textarea value={notes} onChange={(e)=>setNotes(e.target.value)} className="w-full border border-gray-400/50 p-2 rounded bg-gray-100/50 backdrop-blur-sm focus:bg-white/80 transition-colors h-20 text-sm placeholder-gray-400"/>
            </div>
          </div>

          <div className="p-4 border-t border-gray-300/50 bg-gray-100/30">
            <label className="block text-sm font-medium mb-1">Status</label>
            <select value={status} onChange={(e)=>setStatus(e.target.value)} className="w-full border border-gray-400/50 p-2 rounded bg-gray-100/50 backdrop-blur-sm focus:bg-white/80 transition-colors text-sm">
              <option value="active">Active</option>
              <option value="draft">In Development</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
        )}
      </div>
    </>
  );
}
