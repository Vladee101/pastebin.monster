export type Tab = 'retrieve' | 'create';

interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="tab-bar">
      <button
        type="button"
        className={`tab ${activeTab === 'retrieve' ? 'tab-active' : ''}`}
        onClick={() => onTabChange('retrieve')}
      >
        Get Paste
      </button>
      <button
        type="button"
        className={`tab ${activeTab === 'create' ? 'tab-active' : ''}`}
        onClick={() => onTabChange('create')}
      >
        Create Paste
      </button>
    </div>
  );
}
