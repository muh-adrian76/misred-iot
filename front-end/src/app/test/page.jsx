"use client";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { fetchFromBackend } from "@/lib/helper";
import React, { useState, useCallback, useEffect } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";

const ResponsiveGridLayout = WidthProvider(Responsive);

const bootstrapWidths = { lg: 3, md: 4, sm: 6, xs: 12, xxs: 12 };
const cols = { lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 };
const availableHandles = ["sw", "nw", "se", "ne"];

const MultiDashboard = ({ userId = 1 }) => {
  // Dashboard management state
  const [dashboards, setDashboards] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('allDashboards');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return {};
  });

  const [activeDashboardId, setActiveDashboardId] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('activeDashboardId');
      return saved || null;
    }
    return null;
  });

  const [currentBreakpoint, setCurrentBreakpoint] = useState("lg");
  const [layoutKey, setLayoutKey] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showDashboardManager, setShowDashboardManager] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [counterDashboard, setCounterDashboard] = useState(1);

  // Get current dashboard
  const currentDashboard = dashboards[activeDashboardId];

  // API Helper Functions

  // Load dashboards from database
  const loadDashboardsFromDB = useCallback(async () => {
    try {
      setIsLoading(true);
      // const dbDashboards = await fetchFromBackend(`/dashboard`);
      console.log(dbDashboards);
      const dashboardsMap = {};
      for (const dashboard of dbDashboards) {
        dashboardsMap[dashboard.id] = {
          id: dashboard.id,
          name: dashboard.description,
          layouts: dashboard.layout,
          itemCount: dashboard.widget_count,
          createdAt: dashboard.created_at,
          updatedAt: dashboard.updated_at
        };
      }
      
      setDashboards(dashboardsMap);
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('allDashboards', JSON.stringify(dashboardsMap));
      }
      
      // Set active dashboard if none selected
      if (!activeDashboardId && Object.keys(dashboardsMap).length > 0) {
        const firstDashboard = Object.keys(dashboardsMap)[0];
        setActiveDashboardId(firstDashboard);
        saveActiveDashboard(firstDashboard);
      }
    } catch (error) {
      console.error('Error loading dashboards:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, activeDashboardId]);

  // Save dashboard to database
  // const saveDashboardToDB = useCallback(async (dashboard) => {
  //   try {
  //     const dashboardData = {
  //       description: dashboard.name,
  //       user_id: 1,
  //       widget_count: dashboard.itemCount,
  //       layout: dashboard.layouts
  //     };

  //     if (dashboard.id === undefined) {
  //       // Create new dashboard
  //       const response = await fetchFromBackend('/dashboard', {
  //         method: 'POST',
  //         body: JSON.stringify(dashboardData)
  //       });
  //       return response.id;
  //     } else {
  //       // Update existing dashboard
  //       await fetchFromBackend(`/dashboard/${dashboard.id}`, {
  //         method: 'PUT',
  //         body: JSON.stringify(dashboardData)
  //       });
  //       return dashboard.id;
  //     }
  //   } catch (error) {
  //     console.error('Error saving dashboard:', error);
  //     throw error;
  //   }
  // }, [userId]);

  // Delete dashboard from database
  // const deleteDashboardFromDB = useCallback(async (dashboardId) => {
  //   try {
  //     await fetchFromBackend(`/dashboard/${dashboardId}`, {
  //       method: 'DELETE'
  //     });
  //   } catch (error) {
  //     console.error('Error deleting dashboard:', error);
  //     throw error;
  //   }
  // }, []);

  // Load dashboards on component mount
  useEffect(() => {
    loadDashboardsFromDB();
  }, [loadDashboardsFromDB]);

  // Save all dashboards to localStorage
  const saveAllDashboards = useCallback((dashboardsToSave) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('allDashboards', JSON.stringify(dashboardsToSave));
    }
  }, []);

  // Save active dashboard ID
  const saveActiveDashboard = useCallback((dashboardId) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeDashboardId', dashboardId);
    }
  }, []);

  // Update specific dashboard
  const updateDashboard = useCallback(async (dashboardId, updates) => {
    setDashboards(prev => {
      const updated = {
        ...prev,
        [dashboardId]: {
          ...prev[dashboardId],
          ...updates
        }
      };
      saveAllDashboards(updated);
      return updated;
    });

    // Save to database
    try {
      const dashboardToSave = {
        ...dashboards[dashboardId],
        ...updates
      };
      // await saveDashboardToDB(dashboardToSave);
    } catch (error) {
      console.error('Error updating dashboard in database:', error);
    }
  }, [dashboards, saveAllDashboards]);

  // Create new dashboard
  const createDashboard = useCallback(async () => {
    const newDashboard = {
      id: counterDashboard,
      name: `Dashboard ${Object.keys(dashboards).length + 1}`,
      layouts: generateInitialLayouts(0),
      itemCount: 1,
      createdAt: new Date().toISOString()
    };

    try {
      setIsLoading(true);
      
      // Save to database first
      // const realId = await saveDashboardToDB(newDashboard);
      
      // // Update with real ID
      // const finalDashboard = { ...newDashboard, id: realId };
      
      // setDashboards(prev => {
      //   const updated = { ...prev, [realId]: finalDashboard };
      //   saveAllDashboards(updated);
      //   return updated;
      // });

      setActiveDashboardId(realId);
      saveActiveDashboard(realId);
      setShowDashboardManager(false);
      setCounterDashboard(prev => prev + 1);
    } catch (error) {
      console.error('Error creating dashboard:', error);
      alert('Error creating dashboard. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [dashboards, saveAllDashboards, saveActiveDashboard, saveDashboardToDB]);

  // Delete dashboard
  const deleteDashboard = useCallback(async (dashboardId) => {
    if (Object.keys(dashboards).length <= 1) {
      alert('Tidak bisa menghapus dashboard terakhir!');
      return;
    }

    try {
      setIsLoading(true);
      
      // Delete from database
      await deleteDashboardFromDB(dashboardId);
      
      setDashboards(prev => {
        const updated = { ...prev };
        delete updated[dashboardId];
        saveAllDashboards(updated);
        
        // If deleting active dashboard, switch to first available or set to null
        if (dashboardId === activeDashboardId) {
          const firstAvailable = Object.keys(updated)[0] || null;
          setActiveDashboardId(firstAvailable);
          saveActiveDashboard(firstAvailable);
        }
        
        return updated;
      });
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      alert('Error deleting dashboard. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [dashboards, activeDashboardId, saveAllDashboards, saveActiveDashboard, deleteDashboardFromDB]);

  // Rename dashboard
  const renameDashboard = useCallback(async (dashboardId, newName) => {
    await updateDashboard(dashboardId, { name: newName });
  }, [updateDashboard]);

  // Switch dashboard
  const switchDashboard = useCallback((dashboardId) => {
    setActiveDashboardId(dashboardId);
    saveActiveDashboard(dashboardId);
    setIsEditing(false);
    setShowDashboardManager(false);
  }, [saveActiveDashboard]);

  const handleBreakpointChange = useCallback((bp) => {
    setCurrentBreakpoint(bp);
  }, []);

  // Toggle Edit Mode
  const toggleEdit = () => {
    setIsEditing(prev => !prev);
  };

  // Add Widget to current dashboard
  const addWidget = async () => {
    if (!currentDashboard || !activeDashboardId) return;
    
    const newKey = `added-${currentDashboard.itemCount}`;
    const newLayouts = { ...currentDashboard.layouts };
    
    Object.keys(newLayouts).forEach((bp) => {
      const width = bootstrapWidths[bp];
      const existingItems = newLayouts[bp] || [];
      
      // Find the best available position
      const findAvailablePosition = () => {
        for (let y = 0; y < 50; y++) {
          for (let x = 0; x <= cols[bp] - width; x += width) {
            const position = { x, y, w: width, h: 4 };
            const hasCollision = existingItems.some(item => 
              item.x < position.x + position.w &&
              item.x + item.w > position.x &&
              item.y < position.y + position.h &&
              item.y + item.h > position.y
            );
            if (!hasCollision) {
              return position;
            }
          }
        }
        return { x: 0, y: Math.max(0, ...existingItems.map(item => item.y + item.h)), w: width, h: 4 };
      };
      
      const position = findAvailablePosition();
      const item = {
        i: newKey,
        ...position,
        resizeHandles: availableHandles
      };
      newLayouts[bp] = [...existingItems, item];
    });

    // try {
    //   // Save widget to database
    //   await fetchFromBackend('/widget', {
    //     method: 'POST',
    //     body: JSON.stringify({
    //       dashboard_id: activeDashboardId,
    //       type: 'default',
    //       widget_key: newKey,
    //       description: `Widget ${newKey}`,
    //       device_id: 1,
    //       datastream_id: 1,
    //     })
    //   });

      await updateDashboard(activeDashboardId, {
        layouts: newLayouts,
        itemCount: currentDashboard.itemCount + 1
      });
    // } catch (error) {
    //   console.error('Error adding widget:', error);
    //   alert('Error adding widget. Please try again.');
    // }
  };

  // Remove Widget from current dashboard
  const removeWidget = useCallback((keyToRemove) => {
    const handleRemove = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!currentDashboard) return;
      
      const newLayouts = { ...currentDashboard.layouts };
      Object.keys(newLayouts).forEach(bp => {
        newLayouts[bp] = (newLayouts[bp] || []).filter(item => item.i !== keyToRemove);
      });

      try {
        // Delete widget from database
        // await fetchFromBackend(`/widget/key/${keyToRemove}`, {
        //   method: 'DELETE'
        // });

        await updateDashboard(activeDashboardId, { layouts: newLayouts });

        setTimeout(() => {
          setLayoutKey(prev => prev + 1);
        }, 0);
      } catch (error) {
        console.error('Error removing widget:', error);
        alert('Error removing widget. Please try again.');
      }
    };

    return handleRemove;
  }, [currentDashboard, activeDashboardId, updateDashboard]);

  // Layout change handler
  const handleLayoutChange = useCallback(async (layout, allLayouts) => {
    if (!currentDashboard || !activeDashboardId) return;
    
    const cleanLayouts = { ...allLayouts };
    Object.keys(cleanLayouts).forEach(bp => {
      cleanLayouts[bp] = cleanLayouts[bp].map(item => {
        const { static: _, ...cleanItem } = item;
        return cleanItem;
      });
    });
    
    await updateDashboard(activeDashboardId, { layouts: cleanLayouts });
  }, [currentDashboard, activeDashboardId, updateDashboard]);

  // External drag & drop
  const handleDrop = useCallback(
    async (layout, layoutItem, e) => {
      if (!currentDashboard || !activeDashboardId) return;
      
      const newKey = `dropped-${currentDashboard.itemCount}`;
      const newLayouts = { ...currentDashboard.layouts };
      
      Object.keys(newLayouts).forEach((bp) => {
        const width = bootstrapWidths[bp];
        const item = {
          i: newKey,
          x: layoutItem.x,
          y: layoutItem.y,
          w: width,
          h: 4,
          resizeHandles: availableHandles
        };
        newLayouts[bp] = [...(newLayouts[bp] || []), item];
      });

      try {
        // Save widget to database
        // await fetchFromBackend('/widget', {
        //   method: 'POST',
        //   body: JSON.stringify({
        //     dashboard_id: activeDashboardId,
        //     type: 'dropped',
        //     widget_key: newKey,
        //     description: `Widget ${newKey}`,
        //     device_id: 1,
        //     datastream_id: 1,
        //   })
        // });

        await updateDashboard(activeDashboardId, {
          layouts: newLayouts,
          itemCount: currentDashboard.itemCount + 1
        });
      } catch (error) {
        console.error('Error dropping widget:', error);
        alert('Error adding widget. Please try again.');
      }
    },
    [currentDashboard, activeDashboardId, updateDashboard]
  );

  // Show loading state
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div>Loading dashboards...</div>
      </div>
    );
  }

  // If no dashboards exist, show welcome screen
  if (Object.keys(dashboards).length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#6c757d', marginBottom: '20px' }}>
          Selamat Datang di Multi-Dashboard
        </h2>
        <p style={{ color: '#6c757d', marginBottom: '30px', maxWidth: '500px' }}>
          Anda belum memiliki dashboard. Klik tombol di bawah untuk membuat dashboard pertama Anda.
        </p>
        <button
          onClick={createDashboard}
          disabled={isLoading}
          style={{
            padding: '12px 24px',
            backgroundColor: isLoading ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          {isLoading ? '⏳ Membuat...' : '➕ Buat Dashboard Pertama'}
        </button>
      </div>
    );
  }

  // If no active dashboard, show selection
  if (!currentDashboard) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#6c757d', marginBottom: '20px' }}>
          Pilih Dashboard
        </h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {Object.values(dashboards).map((dashboard) => (
            <button
              key={dashboard.id}
              onClick={() => switchDashboard(dashboard.id)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {dashboard.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Get current layout items and filter out dropping element
  const currentLayoutItems = (currentDashboard.layouts[currentBreakpoint] || [])
    .filter(item => item.i !== "__dropping-elem__");

  return (
    <div>
      {/* Dashboard Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ margin: 0 }}>{currentDashboard.name}</h2>
          <span style={{ fontSize: '12px', color: '#666' }}>
            ({Object.keys(dashboards).length} dashboard{Object.keys(dashboards).length > 1 ? 's' : ''})
          </span>
          {isLoading && <span style={{ fontSize: '12px', color: '#28a745' }}>💾 Syncing...</span>}
        </div>
        
        <button
          onClick={() => setShowDashboardManager(!showDashboardManager)}
          style={{
            padding: '8px 12px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          📊 Manage Dashboards
        </button>
      </div>

      {/* Dashboard Manager */}
      {showDashboardManager && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>Dashboard Manager</h3>
            <button
              onClick={createDashboard}
              disabled={isLoading}
              style={{
                padding: '6px 12px',
                backgroundColor: isLoading ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? '⏳ Creating...' : '➕ New Dashboard'}
            </button>
          </div>

          <div style={{ display: 'grid', gap: '10px' }}>
            {Object.values(dashboards).map((dashboard) => (
              <div
                key={dashboard.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px',
                  backgroundColor: dashboard.id === activeDashboardId ? '#e3f2fd' : 'white',
                  borderRadius: '4px',
                  border: '1px solid #dee2e6'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="text"
                    value={dashboard.name}
                    onChange={(e) => renameDashboard(dashboard.id, e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      fontSize: '14px',
                      fontWeight: dashboard.id === activeDashboardId ? 'bold' : 'normal'
                    }}
                  />
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    ({(dashboard.layouts[currentBreakpoint] || []).length} widgets)
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '5px' }}>
                  {dashboard.id !== activeDashboardId && (
                    <button
                      onClick={() => switchDashboard(dashboard.id)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Switch
                    </button>
                  )}
                  
                  {Object.keys(dashboards).length > 1 && (
                    <button
                      onClick={() => deleteDashboard(dashboard.id)}
                      disabled={isLoading}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: isLoading ? '#6c757d' : '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div style={{ marginBottom: "10px" }}>
        <button
          onClick={toggleEdit}
          style={{ 
            marginRight: "10px", 
            padding: "8px 12px",
            backgroundColor: isEditing ? "#4CAF50" : "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          {isEditing ? "💾 Simpan" : "✏️ Edit"}
        </button>
      </div>

      {/* Draggable element - only show when editing */}
      {isEditing && (
        <>
        <div
          className="droppable-element"
          draggable
          unselectable="on"
          onDragStart={(e) => e.dataTransfer.setData("text/plain", "")}
          style={{
            padding: "10px",
            background: "#4CAF50",
            color: "white",
            marginBottom: "10px",
            display: "inline-block",
            cursor: "grab",
            borderRadius: "4px",
          }}
        >
          🎯 Drag Me to Grid
        </div>

        <button
          onClick={addWidget}
          style={{ 
            marginRight: "10px", 
            padding: "8px 12px",
            backgroundColor: "#FF9800",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          ➕ Tambah Widget
        </button>
        </>
      )}

      {/* Grid */}
      <ResponsiveGridLayout
        key={`${activeDashboardId}-${layoutKey}`}
        className="layout"
        layouts={currentDashboard.layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={cols}
        rowHeight={30}
        margin={[10, 10]}
        containerPadding={[0, 0]}
        isDroppable={isEditing}
        isDraggable={isEditing}
        isResizable={isEditing}
        isBounded={true}
        onDrop={handleDrop}
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={handleBreakpointChange}
        measureBeforeMount={false}
        useCSSTransforms={true}
        droppingItem={{ i: "__dropping-elem__", w: bootstrapWidths[currentBreakpoint], h: 4 }}
        preventCollision={false}
        compactType="vertical"
        autoSize={true}
      >
        {currentLayoutItems.map((item) => (
          <div
            key={item.i}
            style={{
              background: isEditing ? "#f0f8ff" : "#eee",
              padding: "10px",
              border: isEditing ? "2px dashed #2196F3" : "1px solid #ccc",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isEditing ? "move" : "default",
              borderRadius: "4px"
            }}
          >
            {isEditing && (
              <button
                onClick={removeWidget(item.i)}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  top: 2,
                  right: 4,
                  background: "red",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: 20,
                  height: 20,
                  fontSize: 12,
                  cursor: "pointer",
                  zIndex: 1000,
                }}
              >
                ✕
              </button>
            )}
            <div style={{ textAlign: "center" }}>
              Widget {item.i}
              <div style={{ fontSize: "10px", color: "#666", marginTop: "4px" }}>
                {currentDashboard.name}
              </div>
              {isEditing && (
                <div style={{ fontSize: "10px", color: "#666", marginTop: "4px" }}>
                  Dapat dipindah & diubah ukuran
                </div>
              )}
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};

export default MultiDashboard;

// Generate initial layouts without static property
function generateInitialLayouts(count) {
  const layoutPerBreakpoint = {};
  const breakpoints = Object.keys(bootstrapWidths);

  for (const bp of breakpoints) {
    const width = bootstrapWidths[bp];
    const columns = cols[bp];
    layoutPerBreakpoint[bp] = Array.from({ length: count }).map((_, i) => ({
      i: i.toString(),
      x: (i * width) % columns,
      y: Math.floor(i / (columns / width)) * 4,
      w: width,
      h: 4,
      resizeHandles: availableHandles
    }));
  }

  return layoutPerBreakpoint;
}