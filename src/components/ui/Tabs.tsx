import React from 'react';
import './Tabs.css';

interface TabProps {
  id: string;
  label: string;
  isActive: boolean;
  onClick: (id: string) => void;
  children: React.ReactNode;
}

interface TabsProps {
  activeTab: string;
  onChange: (tabId: string) => void;
  children: React.ReactNode;
}

export const Tab: React.FC<Omit<TabProps, 'onClick' | 'isActive'>> = ({ children }) => {
  return <div className="tab-content">{children}</div>;
};

export const Tabs: React.FC<TabsProps> = ({ activeTab, onChange, children }) => {
  const tabs = React.Children.toArray(children).filter(
    (child): child is React.ReactElement => React.isValidElement(child)
  );

  return (
    <div className="tabs-container">
      <div className="tabs-header">
        {tabs.map((tab) => {
          const id = tab.props.id;
          return (
            <button
              key={id}
              className={`tab-button ${activeTab === id ? 'active' : ''}`}
              onClick={() => onChange(id)}
            >
              {tab.props.label}
            </button>
          );
        })}
      </div>
      <div className="tabs-content">
        {tabs.map((tab) => {
          return (
            <div
              key={tab.props.id}
              className={`tab-pane ${activeTab === tab.props.id ? 'active' : ''}`}
            >
              {tab.props.children}
            </div>
          );
        })}
      </div>
    </div>
  );
}; 