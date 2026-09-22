"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import ImageSlot from "@/components/ImageSlot";
import { formatPriceFixed } from "@/lib/format";
import { useSession } from "@/lib/auth-client";
import { renderCollageToDataUrl } from "@/lib/collage-renderer";
import type { products as productsSchema, CollageData } from "@/db/schema";

type Product = typeof productsSchema.$inferSelect;

export interface CanvasItem {
  id: string;
  sourceType: "catalog" | "upload";
  productId?: number;
  productSlug?: string;
  title: string;
  imageUrl?: string | null;
  imageLabel?: string;
  priceCents?: number;
  category?: string;
  // Positioning & Transform
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  isLocked?: boolean;
  opacity?: number;
}

export interface SharedCollageInfo {
  postId: number;
  authorName: string;
  authorHandle: string;
  authorImage?: string | null;
  body: string;
  collageData: CollageData;
}

interface Props {
  initialProducts?: Product[];
  sharedCollage?: SharedCollageInfo | null;
}

export default function FashionCollageBoard({
  initialProducts = [],
  sharedCollage = null,
}: Props) {
  const { data: session, isPending: isSessionPending } = useSession();
  const [mounted, setMounted] = useState(false);

  // Viewing someone else's shared collage
  const [viewingShared, setViewingShared] = useState<SharedCollageInfo | null>(sharedCollage ?? null);

  // Sync viewingShared when sharedCollage prop changes
  useEffect(() => {
    if (sharedCollage) {
      setViewingShared(sharedCollage);
    }
  }, [sharedCollage]);

  // Storage key based on user account or guest
  const storageKey = useMemo(() => {
    return session?.user?.id
      ? `lilac_sandbox_items_${session.user.id}`
      : "lilac_sandbox_items_guest";
  }, [session?.user?.id]);

  // Left Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"catalog" | "uploads" | "look">("catalog");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [userUploads, setUserUploads] = useState<{ id: string; url: string; name: string }[]>([]);

  // Canvas View States
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [canvasBg, setCanvasBg] = useState<"cream" | "white" | "mauve" | "sage">("cream");
  const [showGrid, setShowGrid] = useState(true);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Canvas Items & Selection (starts completely EMPTY on first visit)
  const [items, setItems] = useState<CanvasItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Share to Community Modal States
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [sharePreviewUrl, setSharePreviewUrl] = useState<string | null>(null);
  const [shareCaption, setShareCaption] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<{ postId: number } | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Total Look Pricing Calculation
  const totalLookCents = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.priceCents || 0), 0);
  }, [items]);

  // History for Undo/Redo
  const [history, setHistory] = useState<CanvasItem[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Dragging & Interaction Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const interactionRef = useRef<{
    mode: "idle" | "drag-item" | "resize-item" | "rotate-item" | "pan-canvas";
    itemId?: string;
    startX: number;
    startY: number;
    itemStartX: number;
    itemStartY: number;
    itemStartW: number;
    itemStartH: number;
    itemStartRot: number;
    resizeHandle?: "nw" | "ne" | "sw" | "se";
    centerX: number;
    centerY: number;
  }>({
    mode: "idle",
    startX: 0,
    startY: 0,
    itemStartX: 0,
    itemStartY: 0,
    itemStartW: 0,
    itemStartH: 0,
    itemStartRot: 0,
    centerX: 0,
    centerY: 0,
  });

  // Track mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Load saved items from localStorage or sharedCollage (smooth session-aware loader)
  useEffect(() => {
    if (!mounted || typeof window === "undefined" || isSessionPending) return;

    setIsLoaded(false);
    let timeoutId: NodeJS.Timeout;

    try {
      if (viewingShared?.collageData?.items) {
        setItems(viewingShared.collageData.items);
        setHistory([viewingShared.collageData.items]);
        setHistoryIndex(0);
        if (viewingShared.collageData.canvasBg) {
          setCanvasBg(viewingShared.collageData.canvasBg);
        }
      } else {
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setItems(parsed);
            setHistory([parsed]);
            setHistoryIndex(0);
          } else {
            setItems([]);
            setHistory([[]]);
            setHistoryIndex(0);
          }
        } else {
          // First time visit -> Completely empty
          setItems([]);
          setHistory([[]]);
          setHistoryIndex(0);
        }
      }

      // Load user uploads
      const savedUploads = localStorage.getItem("lilac_sandbox_user_uploads");
      if (savedUploads) {
        const parsedUploads = JSON.parse(savedUploads);
        if (Array.isArray(parsedUploads)) {
          setUserUploads(parsedUploads);
        }
      }
    } catch (e) {
      console.error("Error loading sandbox state:", e);
    } finally {
      // Smooth restoration delay to guarantee no flashing of empty state
      timeoutId = setTimeout(() => {
        setIsLoaded(true);
      }, 400);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [storageKey, isSessionPending, mounted, viewingShared]);

  // 2. Save items automatically whenever items change (only if not viewing someone else's shared collage)
  useEffect(() => {
    if (!isLoaded || typeof window === "undefined" || viewingShared) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
      setLastSavedTime(
        new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      );
    } catch (e) {
      console.error("Error saving sandbox state:", e);
    }
  }, [items, storageKey, isLoaded, viewingShared]);

  // Restore user's own local sandbox if they want to exit viewing shared collage
  const handleRestoreMySandbox = useCallback(() => {
    setViewingShared(null);
    if (typeof window !== "undefined") {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          const loaded = Array.isArray(parsed) ? parsed : [];
          setItems(loaded);
          setHistory([loaded]);
          setHistoryIndex(0);
        } catch {
          setItems([]);
        }
      } else {
        setItems([]);
        setHistory([[]]);
        setHistoryIndex(0);
      }
    }
  }, [storageKey]);

  // Push state to history
  const pushHistory = useCallback((newItems: CanvasItem[]) => {
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, newItems];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setItems(history[prevIndex]);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setItems(history[nextIndex]);
    }
  }, [historyIndex, history]);

  // Categories extracted from products
  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    for (const p of initialProducts) {
      if (p.category) cats.add(p.category);
    }
    return Array.from(cats).sort();
  }, [initialProducts]);

  // Set of product IDs currently placed in the sandbox
  const inSandboxProductIds = useMemo(() => {
    const set = new Set<number>();
    for (const it of items) {
      if (it.productId != null) set.add(it.productId);
    }
    return set;
  }, [items]);

  // Filtered Catalog Products
  const filteredCatalog = useMemo(() => {
    return initialProducts.filter((p) => {
      if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.subtitle ? p.subtitle.toLowerCase().includes(q) : false)
        );
      }
      return true;
    });
  }, [initialProducts, selectedCategory, searchQuery]);

  // Add Item to Canvas
  const addItemToCanvas = useCallback(
    (itemData: Partial<CanvasItem>, dropClientX?: number, dropClientY?: number) => {
      let dropX = 350;
      let dropY = 220;

      if (canvasRef.current && dropClientX != null && dropClientY != null) {
        const rect = canvasRef.current.getBoundingClientRect();
        dropX = (dropClientX - rect.left - pan.x) / zoom - 100;
        dropY = (dropClientY - rect.top - pan.y) / zoom - 100;
      } else {
        const containerW = canvasRef.current ? canvasRef.current.clientWidth : 800;
        const containerH = canvasRef.current ? canvasRef.current.clientHeight : 600;
        const jitterX = Math.floor(Math.random() * 80) - 40;
        const jitterY = Math.floor(Math.random() * 80) - 40;
        dropX = (containerW / 2 - pan.x) / zoom - 100 + jitterX;
        dropY = (containerH / 2 - pan.y) / zoom - 110 + jitterY;
      }

      const nextZIndex = items.reduce((max, it) => Math.max(max, it.zIndex), 0) + 1;

      const newItem: CanvasItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sourceType: itemData.sourceType || "catalog",
        productId: itemData.productId,
        productSlug: itemData.productSlug,
        title: itemData.title || "Custom Piece",
        imageUrl: itemData.imageUrl || null,
        imageLabel: itemData.imageLabel || itemData.title,
        priceCents: itemData.priceCents,
        category: itemData.category,
        x: Math.max(40, dropX),
        y: Math.max(40, dropY),
        width: itemData.width || 210,
        height: itemData.height || 230,
        rotation: 0,
        zIndex: nextZIndex,
        opacity: 1,
      };

      const nextItems = [...items, newItem];
      setItems(nextItems);
      setSelectedItemId(newItem.id);
      pushHistory(nextItems);
    },
    [items, zoom, pan, pushHistory]
  );

  // Handle User File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        if (dataUrl) {
          const newUpload = {
            id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            url: dataUrl,
            name: file.name.replace(/\.[^/.]+$/, ""),
          };
          setUserUploads((prev) => {
            const updated = [newUpload, ...prev];
            try {
              localStorage.setItem("lilac_sandbox_user_uploads", JSON.stringify(updated));
            } catch (err) {
              console.error("Storage limit reached:", err);
            }
            return updated;
          });

          // Automatically add to canvas
          addItemToCanvas({
            sourceType: "upload",
            title: newUpload.name,
            imageUrl: newUpload.url,
            imageLabel: newUpload.name,
            width: 220,
            height: 240,
          });
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Delete Selected Item
  const deleteItem = useCallback(
    (id: string) => {
      const nextItems = items.filter((it) => it.id !== id);
      setItems(nextItems);
      if (selectedItemId === id) setSelectedItemId(null);
      pushHistory(nextItems);
    },
    [items, selectedItemId, pushHistory]
  );

  // Duplicate Selected Item
  const duplicateItem = useCallback(
    (id: string) => {
      const it = items.find((i) => i.id === id);
      if (!it) return;
      const nextZIndex = items.reduce((max, i) => Math.max(max, i.zIndex), 0) + 1;
      const duplicated: CanvasItem = {
        ...it,
        id: `item-copy-${Date.now()}`,
        x: it.x + 30,
        y: it.y + 30,
        zIndex: nextZIndex,
      };
      const nextItems = [...items, duplicated];
      setItems(nextItems);
      setSelectedItemId(duplicated.id);
      pushHistory(nextItems);
    },
    [items, pushHistory]
  );

  // Layering Controls
  const bringForward = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      const nextItems = items.map((i) => (i.id === id ? { ...i, zIndex: i.zIndex + 1 } : i));
      setItems(nextItems);
      pushHistory(nextItems);
    },
    [items, pushHistory]
  );

  const sendBackward = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      const nextItems = items.map((i) => (i.id === id ? { ...i, zIndex: Math.max(1, i.zIndex - 1) } : i));
      setItems(nextItems);
      pushHistory(nextItems);
    },
    [items, pushHistory]
  );

  const rotateItem = useCallback(
    (id: string, deltaAngle: number) => {
      const nextItems = items.map((i) => (i.id === id ? { ...i, rotation: (i.rotation + deltaAngle) % 360 } : i));
      setItems(nextItems);
      pushHistory(nextItems);
    },
    [items, pushHistory]
  );

  // Clear Canvas
  const clearCanvas = useCallback(() => {
    if (items.length === 0) return;
    if (window.confirm("Are you sure you want to clear your sandbox moodboard?")) {
      setItems([]);
      setSelectedItemId(null);
      pushHistory([]);
    }
  }, [items, pushHistory]);

  // Export / Download Snapshot
  const exportCanvasAsImage = useCallback(async () => {
    if (items.length === 0) {
      alert("Your moodboard is currently empty. Add some pieces first before exporting!");
      return;
    }

    try {
      const dataUrl = await renderCollageToDataUrl(items, canvasBg, showGrid);
      if (!dataUrl) {
        alert("Could not generate moodboard image.");
        return;
      }
      const link = document.createElement("a");
      link.download = `lilac-moodboard-${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export error:", err);
      alert("An error occurred while exporting the moodboard.");
    }
  }, [items, canvasBg, showGrid]);

  // Open Share to Community Modal
  const handleOpenShareModal = useCallback(async () => {
    if (items.length === 0) {
      alert("Your moodboard is currently empty. Add some pieces first before sharing to the community!");
      return;
    }
    if (!session?.user) {
      const confirmLogin = confirm(
        "You must be signed in to share your moodboard to the Lilac Drawer community.\nWould you like to sign in now?"
      );
      if (confirmLogin && typeof window !== "undefined") {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      }
      return;
    }

    setIsShareModalOpen(true);
    setPublishSuccess(null);
    setPublishError(null);
    setIsGeneratingPreview(true);

    try {
      const dataUrl = await renderCollageToDataUrl(items, canvasBg, showGrid);
      setSharePreviewUrl(dataUrl);
    } catch (err) {
      console.error("Failed to render collage preview:", err);
      setPublishError("Could not prepare moodboard image preview. Please try again.");
    } finally {
      setIsGeneratingPreview(false);
    }
  }, [items, canvasBg, showGrid, session?.user]);

  // Publish Collage Post to Community Feed
  const handlePublishToCommunity = async () => {
    if (!sharePreviewUrl || isPublishing) return;
    setIsPublishing(true);
    setPublishError(null);

    try {
      const payload = {
        body: shareCaption.trim(),
        imageUrl: sharePreviewUrl,
        images: [sharePreviewUrl],
        imageLabel: "Fashion Moodboard",
        collageData: {
          items: items.map((it) => ({
            id: it.id,
            sourceType: it.sourceType,
            productId: it.productId,
            productSlug: it.productSlug,
            title: it.title,
            imageUrl: it.imageUrl,
            priceCents: it.priceCents,
            category: it.category,
            x: it.x,
            y: it.y,
            width: it.width,
            height: it.height,
            rotation: it.rotation,
            zIndex: it.zIndex,
            opacity: it.opacity,
          })),
          canvasBg,
          itemCount: items.length,
          totalLookCents,
        },
      };

      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to publish moodboard to community");
      }

      setPublishSuccess({ postId: data.id });
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "An error occurred while publishing to community");
    } finally {
      setIsPublishing(false);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedItemId) {
        e.preventDefault();
        deleteItem(selectedItemId);
      } else if (e.key === "Escape") {
        setSelectedItemId(null);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d" && selectedItemId) {
        e.preventDefault();
        duplicateItem(selectedItemId);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItemId, deleteItem, duplicateItem, handleUndo, handleRedo]);

  // Pointer Handlers for Items
  const handleItemPointerDown = (e: React.PointerEvent, item: CanvasItem) => {
    e.stopPropagation();
    setSelectedItemId(item.id);

    interactionRef.current = {
      mode: "drag-item",
      itemId: item.id,
      startX: e.clientX,
      startY: e.clientY,
      itemStartX: item.x,
      itemStartY: item.y,
      itemStartW: item.width,
      itemStartH: item.height,
      itemStartRot: item.rotation,
      centerX: item.x + item.width / 2,
      centerY: item.y + item.height / 2,
    };
  };

  // Resize Handle Pointer Down
  const handleResizePointerDown = (e: React.PointerEvent, item: CanvasItem, handle: "nw" | "ne" | "sw" | "se") => {
    e.stopPropagation();
    interactionRef.current = {
      mode: "resize-item",
      itemId: item.id,
      resizeHandle: handle,
      startX: e.clientX,
      startY: e.clientY,
      itemStartX: item.x,
      itemStartY: item.y,
      itemStartW: item.width,
      itemStartH: item.height,
      itemStartRot: item.rotation,
      centerX: item.x + item.width / 2,
      centerY: item.y + item.height / 2,
    };
  };

  // Rotate Handle Pointer Down
  const handleRotatePointerDown = (e: React.PointerEvent, item: CanvasItem) => {
    e.stopPropagation();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const itemCenterX = rect.left + pan.x + (item.x + item.width / 2) * zoom;
    const itemCenterY = rect.top + pan.y + (item.y + item.height / 2) * zoom;

    interactionRef.current = {
      mode: "rotate-item",
      itemId: item.id,
      startX: e.clientX,
      startY: e.clientY,
      itemStartX: item.x,
      itemStartY: item.y,
      itemStartW: item.width,
      itemStartH: item.height,
      itemStartRot: item.rotation,
      centerX: itemCenterX,
      centerY: itemCenterY,
    };
  };

  // Canvas Pan Pointer Down
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains("canvas-surface")) {
      setSelectedItemId(null);
      interactionRef.current = {
        mode: "pan-canvas",
        startX: e.clientX,
        startY: e.clientY,
        itemStartX: pan.x,
        itemStartY: pan.y,
        itemStartW: 0,
        itemStartH: 0,
        itemStartRot: 0,
        centerX: 0,
        centerY: 0,
      };
    }
  };

  // Global Pointer Move
  const handleGlobalPointerMove = useCallback(
    (e: PointerEvent) => {
      const current = interactionRef.current;
      if (current.mode === "idle") return;

      if (current.mode === "drag-item" && current.itemId) {
        const dx = (e.clientX - current.startX) / zoom;
        const dy = (e.clientY - current.startY) / zoom;

        setItems((prev) =>
          prev.map((it) =>
            it.id === current.itemId
              ? {
                  ...it,
                  x: Math.round(current.itemStartX + dx),
                  y: Math.round(current.itemStartY + dy),
                }
              : it
          )
        );
      } else if (current.mode === "resize-item" && current.itemId) {
        const dx = (e.clientX - current.startX) / zoom;
        const dy = (e.clientY - current.startY) / zoom;
        const handle = current.resizeHandle;

        setItems((prev) =>
          prev.map((it) => {
            if (it.id !== current.itemId) return it;

            let newW = current.itemStartW;
            let newH = current.itemStartH;
            let newX = current.itemStartX;
            let newY = current.itemStartY;

            if (handle === "se") {
              newW = Math.max(80, current.itemStartW + dx);
              newH = Math.max(80, current.itemStartH + dy);
            } else if (handle === "sw") {
              newW = Math.max(80, current.itemStartW - dx);
              newH = Math.max(80, current.itemStartH + dy);
              newX = current.itemStartX + (current.itemStartW - newW);
            } else if (handle === "ne") {
              newW = Math.max(80, current.itemStartW + dx);
              newH = Math.max(80, current.itemStartH - dy);
              newY = current.itemStartY + (current.itemStartH - newH);
            } else if (handle === "nw") {
              newW = Math.max(80, current.itemStartW - dx);
              newH = Math.max(80, current.itemStartH - dy);
              newX = current.itemStartX + (current.itemStartW - newW);
              newY = current.itemStartY + (current.itemStartH - newH);
            }

            return {
              ...it,
              x: Math.round(newX),
              y: Math.round(newY),
              width: Math.round(newW),
              height: Math.round(newH),
            };
          })
        );
      } else if (current.mode === "rotate-item" && current.itemId) {
        const rad = Math.atan2(e.clientY - current.centerY, e.clientX - current.centerX);
        const deg = Math.round((rad * 180) / Math.PI);
        const finalAngle = (deg + 90) % 360;

        setItems((prev) =>
          prev.map((it) => (it.id === current.itemId ? { ...it, rotation: finalAngle } : it))
        );
      } else if (current.mode === "pan-canvas") {
        const dx = e.clientX - current.startX;
        const dy = e.clientY - current.startY;
        setPan({
          x: current.itemStartX + dx,
          y: current.itemStartY + dy,
        });
      }
    },
    [zoom]
  );

  // Global Pointer Up
  const handleGlobalPointerUp = useCallback(() => {
    if (interactionRef.current.mode !== "idle") {
      interactionRef.current.mode = "idle";
      pushHistory(items);
    }
  }, [items, pushHistory]);

  useEffect(() => {
    window.addEventListener("pointermove", handleGlobalPointerMove);
    window.addEventListener("pointerup", handleGlobalPointerUp);
    return () => {
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
    };
  }, [handleGlobalPointerMove, handleGlobalPointerUp]);

  // Zoom Controls
  const zoomIn = () => setZoom((z) => Math.min(2.5, Number((z + 0.15).toFixed(2))));
  const zoomOut = () => setZoom((z) => Math.max(0.4, Number((z - 0.15).toFixed(2))));
  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Drag from Left Drawer to Canvas
  const handleCatalogDragStart = (e: React.DragEvent, itemData: Partial<CanvasItem>) => {
    e.dataTransfer.setData("application/json", JSON.stringify(itemData));
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        addItemToCanvas(parsed, e.clientX, e.clientY);
      }
    } catch (err) {
      console.error("Drop error:", err);
    }
  };

  // Color background mapping (Unified throughout whole canvas)
  const bgClass =
    canvasBg === "white"
      ? "bg-white text-purple-deep"
      : canvasBg === "cream"
      ? "bg-[#fbf6f0] text-purple-deep"
      : canvasBg === "mauve"
      ? "bg-[#f6eff8] text-purple-deep"
      : "bg-[#edf4ea] text-purple-deep";

  if (!mounted) {
    return (
      <div className="bg-[#fbf6f0] h-screen flex flex-col items-center justify-center font-sans text-purple-deep">
        <div className="w-10 h-10 rounded-full border-3 border-lilac border-t-transparent animate-spin mb-4" />
        <div className="text-xs font-bold uppercase tracking-wider text-tan-dark">Loading Sandbox...</div>
      </div>
    );
  }

  return (
    <div className={`${bgClass} h-screen flex flex-col overflow-hidden font-sans select-none transition-colors duration-300`}>
      {/* 1. TOP NAVIGATION & ACTION BAR */}
      <header className="h-16 border-b border-border bg-white/90 backdrop-blur-md px-2.5 sm:px-4 md:px-6 flex items-center justify-between gap-2 sm:gap-4 z-30 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 md:gap-5 min-w-0">
          {/* Toggle Drawer Button */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="p-2 rounded-xl border border-border hover:bg-mauve-50 text-purple-deep transition-colors cursor-pointer shrink-0"
            title={isDrawerOpen ? "Collapse Pieces Drawer" : "Expand Pieces Drawer"}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {isDrawerOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          <Link href="/" className="font-heading text-base sm:text-lg md:text-xl font-bold text-purple-deep hover:text-rose transition-colors truncate">
            Lilac Drawer
          </Link>
          <span className="hidden md:inline-block text-border font-light">|</span>
          <div className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose">
            <svg className="w-4 h-4 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Fashion Sandbox</span>
          </div>
        </div>

        {/* Auto-Save & User Status Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-mauve-50 border border-border text-[11px] font-semibold text-purple-deep">
          <span className={`w-2 h-2 rounded-full ${!isLoaded ? "bg-amber-400 animate-ping" : "bg-sage animate-pulse"}`} />
          <span>
            {!isLoaded
              ? "Restoring sandbox..."
              : session?.user?.name
              ? `Saved to ${session.user.name}'s Sandbox`
              : "Auto-saved to Sandbox"}
          </span>
          {lastSavedTime && isLoaded && <span className="text-tan-dark">• {lastSavedTime}</span>}
        </div>

        {/* Right Actions: Undo, Redo, Clear, Export */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Undo Button */}
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 sm:p-2 rounded-xl border border-border text-purple-deep hover:bg-mauve-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2m0 0l-4-4m4 4l4-4" />
            </svg>
          </button>

          {/* Redo Button */}
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 sm:p-2 rounded-xl border border-border text-purple-deep hover:bg-mauve-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a5 5 0 00-5 5v2m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>

          <div className="w-px h-5 sm:h-6 bg-border mx-0.5 sm:mx-1" />

          {/* Clear Canvas */}
          <button
            onClick={clearCanvas}
            disabled={items.length === 0}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-border text-xs font-semibold text-tan-dark hover:text-rose hover:bg-mauve-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Clear Sandbox"
          >
            Clear
          </button>

          {/* Export / Download Moodboard */}
          <button
            onClick={exportCanvasAsImage}
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-border text-purple-deep hover:bg-mauve-50 text-xs font-bold transition-all cursor-pointer"
            title="Download Snapshot as JPG"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">Export JPG</span>
          </button>

          {/* Share to Community */}
          <button
            onClick={handleOpenShareModal}
            disabled={items.length === 0}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-purple-deep via-purple-deep to-rose text-white text-xs font-bold hover:opacity-95 shadow-xs transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Share moodboard to Lilac Drawer community"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span className="hidden sm:inline">Share to Community</span>
            <span className="sm:hidden">Share</span>
          </button>
        </div>
      </header>

      {/* VIEWING SHARED MOODBOARD BANNER */}
      {viewingShared && (
        <div className="bg-gradient-to-r from-mauve-100 via-cream to-mauve-100 border-b border-lilac/30 px-3.5 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-30 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-7 h-7 rounded-xl bg-purple-deep/10 text-purple-deep flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-purple-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-purple-deep truncate">
                Viewing moodboard shared by{" "}
                <Link
                  href={`/community/${viewingShared.authorHandle}`}
                  className="font-bold underline text-purple-deep hover:text-rose"
                >
                  @{viewingShared.authorHandle}
                </Link>{" "}
                ({viewingShared.authorName})
              </p>
              {viewingShared.body && (
                <p className="text-[11px] text-tan-dark truncate italic">
                  &ldquo;{viewingShared.body}&rdquo;
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/community/post/${viewingShared.postId}`}
              className="px-3 py-1.5 rounded-xl bg-white border border-border text-purple-deep hover:bg-mauve-50 font-semibold text-xs shadow-2xs transition-colors flex items-center gap-1"
            >
              <span>View in Community</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>

            <button
              onClick={() => {
                localStorage.setItem(storageKey, JSON.stringify(items));
                setViewingShared(null);
                alert("A copy of this moodboard has been saved to your personal sandbox!");
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-deep text-white font-semibold text-xs hover:bg-purple-deep/90 shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Save Copy to My Board</span>
            </button>

            <button
              onClick={handleRestoreMySandbox}
              className="px-2.5 py-1.5 rounded-xl border border-border text-tan-dark hover:text-purple-deep hover:bg-white text-xs font-medium transition-colors cursor-pointer"
              title="Return to my previous sandbox"
            >
              My Sandbox ✕
            </button>
          </div>
        </div>
      )}

      {/* 2. MAIN WORKSPACE (DRAWER + UNIFIED FULL-VIEWPORT SANDBOX) */}
      <div className="flex-1 min-h-0 flex relative overflow-hidden">
        {/* LEFT PALETTE / PIECES & UPLOAD DRAWER */}
        <aside
          className={`border-r border-border bg-white flex flex-col transition-all duration-300 z-20 shrink-0 ${
            isDrawerOpen
              ? "w-full sm:w-80 md:w-96 shadow-xl absolute inset-y-0 left-0 sm:relative"
              : "w-0 -translate-x-full overflow-hidden border-none"
          }`}
        >
          {/* Mobile Close Bar */}
          <div className="sm:hidden flex items-center justify-between px-3.5 py-2 bg-mauve-100/70 border-b border-border">
            <span className="text-xs font-bold text-purple-deep">Pieces &amp; Uploads</span>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="px-2.5 py-1 bg-white rounded-lg text-xs font-bold text-purple-deep border border-border shadow-2xs"
            >
              Done / Close ✕
            </button>
          </div>

          {/* Drawer Tabs: Catalog vs Uploads vs Look Breakdown & Prices */}
          <div className="p-2.5 border-b border-border bg-mauve-50/50 grid grid-cols-3 gap-1.5">
            <button
              onClick={() => setActiveTab("catalog")}
              className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === "catalog"
                  ? "bg-purple-deep text-white shadow-xs"
                  : "bg-white border border-border text-tan-dark hover:text-purple-deep"
              }`}
              title="Site Catalog Pieces"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="truncate">Pieces ({initialProducts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("uploads")}
              className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === "uploads"
                  ? "bg-purple-deep text-white shadow-xs"
                  : "bg-white border border-border text-tan-dark hover:text-purple-deep"
              }`}
              title="Uploaded Images"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="truncate">Uploads ({userUploads.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("look")}
              className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 relative ${
                activeTab === "look"
                  ? "bg-purple-deep text-white shadow-xs"
                  : "bg-white border border-border text-tan-dark hover:text-purple-deep"
              }`}
              title="Look Breakdown, Prices & Links"
            >
              <svg className="w-3.5 h-3.5 shrink-0 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="truncate">Look ({items.length})</span>
              {items.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose absolute top-1.5 right-1.5" />
              )}
            </button>
          </div>

          {/* TAB 1: CATALOG PRODUCTS */}
          {activeTab === "catalog" && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Search Bar & Category Pills */}
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search pieces..."
                    className="w-full pl-9 pr-8 py-2 bg-mauve-50/60 border border-border rounded-xl text-xs text-purple-deep placeholder:text-tan outline-none focus:border-rose"
                  />
                  <svg
                    className="w-3.5 h-3.5 text-tan absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-tan hover:text-purple-deep text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Categories Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 pb-1 scrollbar-none">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === "all"
                        ? "bg-purple-deep text-white"
                        : "bg-mauve-50 text-tan-dark hover:text-purple-deep"
                    }`}
                  >
                    All
                  </button>
                  {categoriesList.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        selectedCategory === cat
                          ? "bg-purple-deep text-white"
                          : "bg-mauve-50 text-tan-dark hover:text-purple-deep"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Grid in Drawer */}
              <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2.5">
                {filteredCatalog.map((prod) => {
                  const isAlreadyAdded = inSandboxProductIds.has(prod.id);

                  return (
                    <div
                      key={prod.id}
                      draggable
                      onDragStart={(e) =>
                        handleCatalogDragStart(e, {
                          sourceType: "catalog",
                          productId: prod.id,
                          productSlug: prod.slug,
                          title: prod.name,
                          imageUrl: prod.imageUrl,
                          imageLabel: prod.imageLabel,
                          priceCents: prod.priceCents,
                          category: prod.category,
                          width: 210,
                          height: 230,
                        })
                      }
                      onClick={() =>
                        addItemToCanvas({
                          sourceType: "catalog",
                          productId: prod.id,
                          productSlug: prod.slug,
                          title: prod.name,
                          imageUrl: prod.imageUrl,
                          imageLabel: prod.imageLabel,
                          priceCents: prod.priceCents,
                          category: prod.category,
                          width: 210,
                          height: 230,
                        })
                      }
                      className={`p-2.5 rounded-2xl border transition-all cursor-grab active:cursor-grabbing group flex flex-col justify-between ${
                        isAlreadyAdded
                          ? "bg-mauve-100/60 border-rose/50 shadow-xs"
                          : "bg-mauve-50/40 hover:bg-mauve-100/70 border-border/80"
                      }`}
                    >
                      <div className="aspect-square rounded-xl overflow-hidden bg-white mb-2 flex items-center justify-center p-1.5 border border-border/50 relative">
                        <ImageSlot
                          imageUrl={prod.imageUrl}
                          label={prod.imageLabel || prod.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                          shape="rounded"
                          radius={8}
                          tone="mauve"
                        />
                        {isAlreadyAdded && (
                          <span className="absolute top-1 right-1 bg-rose text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
                            <span>✓</span>
                            <span>Added</span>
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-rose line-clamp-1">
                          {prod.category}
                        </div>
                        <div className="text-xs font-bold text-purple-deep group-hover:text-rose transition-colors line-clamp-1 leading-snug">
                          {prod.name}
                        </div>
                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-border/50">
                          <span className="text-xs font-bold text-rose">
                            {formatPriceFixed(prod.priceCents)}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                              isAlreadyAdded
                                ? "bg-rose text-white border-rose"
                                : "bg-white text-purple-deep border-border/60 hover:bg-purple-deep hover:text-white"
                            }`}
                          >
                            {isAlreadyAdded ? "+ More" : "+ Add"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: USER UPLOADS */}
          {activeTab === "uploads" && (
            <div className="flex-1 flex flex-col p-4 gap-4 min-h-0 overflow-y-auto">
              {/* Upload Dropzone */}
              <label className="border-2 border-dashed border-lilac/50 hover:border-lilac rounded-2xl p-6 bg-mauve-50/50 hover:bg-mauve-50 transition-colors flex flex-col items-center justify-center text-center cursor-pointer gap-2 group">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-purple-deep shadow-xs group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-purple-deep">Upload Photos from Device</span>
                <span className="text-[10.5px] text-tan-dark">PNG, JPG, WebP supported</span>
              </label>

              {/* Uploaded Photos Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-tan-dark mb-2">
                  Your Uploaded Items ({userUploads.length})
                </h4>
                {userUploads.length === 0 ? (
                  <p className="text-xs text-tan-dark italic text-center py-6">
                    No custom uploads yet. Click above to add photos from your device.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {userUploads.map((up) => (
                      <div
                        key={up.id}
                        draggable
                        onDragStart={(e) =>
                          handleCatalogDragStart(e, {
                            sourceType: "upload",
                            title: up.name,
                            imageUrl: up.url,
                            imageLabel: up.name,
                            width: 220,
                            height: 240,
                          })
                        }
                        onClick={() =>
                          addItemToCanvas({
                            sourceType: "upload",
                            title: up.name,
                            imageUrl: up.url,
                            imageLabel: up.name,
                            width: 220,
                            height: 240,
                          })
                        }
                        className="p-2 rounded-2xl bg-mauve-50/50 hover:bg-mauve-100/70 border border-border transition-all cursor-grab active:cursor-grabbing group"
                      >
                        <div className="aspect-square rounded-xl overflow-hidden bg-white mb-1.5 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={up.url} alt={up.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="text-[11px] font-semibold text-purple-deep truncate">{up.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: LOOK BREAKDOWN, TOTAL PRICES & PRODUCT LINKS */}
          {activeTab === "look" && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Header Pricing Summary Banner */}
              <div className="p-4 bg-gradient-to-br from-mauve-100/80 to-mauve-50/90 border-b border-border">
                <div className="flex items-center justify-between text-xs text-tan-dark mb-1 font-semibold">
                  <span>Total Look Value</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-border/80 text-[10.5px] font-bold text-purple-deep">
                    {items.length} {items.length === 1 ? "Piece" : "Pieces"}
                  </span>
                </div>
                <div className="font-heading text-2xl font-bold text-purple-deep tracking-tight">
                  {formatPriceFixed(totalLookCents)}
                </div>
                <p className="text-[11px] text-tan mt-1 leading-snug">
                  Comprehensive prices & direct store links for all pieces placed on your moodboard.
                </p>
              </div>

              {/* Placed Pieces List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {items.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-2xl bg-mauve-50/40 border border-dashed border-border mt-2">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mx-auto mb-2 text-rose shadow-2xs">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h5 className="font-heading text-sm font-bold text-purple-deep mb-1">No Pieces on Board</h5>
                    <p className="text-xs text-tan-dark mb-4 max-w-[220px] mx-auto">
                      Add items from Site Pieces or Uploads to view their pricing summary and links here.
                    </p>
                    <button
                      onClick={() => setActiveTab("catalog")}
                      className="px-4 py-2 rounded-full bg-purple-deep text-white text-xs font-bold hover:bg-purple-deep/90 transition-all cursor-pointer shadow-xs"
                    >
                      Browse Site Pieces →
                    </button>
                  </div>
                ) : (
                  items.map((item, index) => {
                    const isSelected = item.id === selectedItemId;

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-2xl border transition-all flex flex-col gap-2.5 bg-white shadow-xs ${
                          isSelected ? "border-rose ring-1 ring-rose" : "border-border hover:border-purple-deep/40"
                        }`}
                      >
                        <div className="flex gap-3">
                          {/* Item Thumbnail */}
                          <div
                            onClick={() => setSelectedItemId(item.id)}
                            className="w-14 h-14 rounded-xl overflow-hidden bg-mauve-50/60 border border-border/80 p-1 flex items-center justify-center shrink-0 cursor-pointer hover:opacity-90"
                            title="Click to select on canvas"
                          >
                            {item.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <ImageSlot
                                label={item.imageLabel || item.title}
                                className="w-full h-full object-contain"
                                shape="rounded"
                                radius={8}
                                tone="mauve"
                              />
                            )}
                          </div>

                          {/* Info & Price */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-tan">
                                #{index + 1} · {item.sourceType === "catalog" ? item.category || "Piece" : "Upload"}
                              </span>
                            </div>
                            <h4
                              onClick={() => setSelectedItemId(item.id)}
                              className="text-xs font-bold text-purple-deep truncate cursor-pointer hover:text-rose transition-colors"
                              title={item.title}
                            >
                              {item.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.priceCents != null ? (
                                <span className="text-xs font-bold text-rose">
                                  {formatPriceFixed(item.priceCents)}
                                </span>
                              ) : (
                                <span className="text-[11px] text-tan italic">Custom Upload</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card Action Buttons: View Deal Link + Canvas Tools */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                          {item.productSlug ? (
                            <Link
                              href={`/deals/${item.productSlug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-bold text-purple-deep hover:text-rose transition-colors"
                            >
                              <span>View Product Deal</span>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </Link>
                          ) : (
                            <span className="text-[11px] text-tan">User Photo</span>
                          )}

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedItemId(item.id)}
                              className="text-[11px] font-semibold text-tan-dark hover:text-purple-deep transition-colors cursor-pointer"
                              title="Focus piece on canvas"
                            >
                              {isSelected ? "Selected" : "Select"}
                            </button>
                            <span className="text-border">•</span>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="text-[11px] font-semibold text-tan hover:text-rose transition-colors cursor-pointer"
                              title="Remove piece from board"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Persistent Quick Pricing Footer in Drawer when on Catalog or Uploads tab */}
          {activeTab !== "look" && items.length > 0 && (
            <div className="p-3 border-t border-border bg-white shadow-md flex items-center justify-between gap-2 shrink-0">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider font-bold text-tan">Look Total</div>
                <div className="text-sm font-bold text-purple-deep truncate">
                  {formatPriceFixed(totalLookCents)}{" "}
                  <span className="text-[11px] font-medium text-tan">({items.length} pcs)</span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("look")}
                className="px-3 py-1.5 rounded-xl bg-purple-deep text-white text-xs font-bold hover:bg-purple-deep/90 transition-all cursor-pointer shadow-xs whitespace-nowrap"
              >
                View Prices & Links →
              </button>
            </div>
          )}

        </aside>

        {/* UNIFIED FULL-VIEWPORT SANDBOX CANVAS */}
        <main
          ref={canvasRef}
          onPointerDown={handleCanvasPointerDown}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleCanvasDrop}
          className="flex-1 relative overflow-hidden cursor-crosshair canvas-surface w-full h-full"
        >
          {/* Subtle Grid Dot Background */}
          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none opacity-30 canvas-surface"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(122, 90, 140, 0.25) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
          )}

          {/* Transformable Canvas Surface */}
          <div
            className="absolute inset-0 origin-top-left transition-transform duration-75 canvas-surface"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          >
            {/* Active Canvas Items */}
            {items.map((item) => {
              const isSelected = item.id === selectedItemId;

              return (
                <div
                  key={item.id}
                  onPointerDown={(e) => handleItemPointerDown(e, item)}
                  style={{
                    position: "absolute",
                    left: `${item.x}px`,
                    top: `${item.y}px`,
                    width: `${item.width}px`,
                    height: `${item.height}px`,
                    transform: `rotate(${item.rotation}deg)`,
                    zIndex: item.zIndex,
                    opacity: item.opacity ?? 1,
                  }}
                  className={`group absolute rounded-2xl cursor-grab active:cursor-grabbing transition-shadow ${
                    isSelected ? "ring-2 ring-rose ring-offset-2 shadow-2xl" : "hover:shadow-lg shadow-md"
                  }`}
                >
                  {/* Item Content Box */}
                  <div className="w-full h-full rounded-2xl overflow-hidden bg-white border border-border/80 p-3 shadow-xs flex flex-col justify-between pointer-events-none">
                    <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden rounded-xl bg-mauve-50/40">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <ImageSlot
                          label={item.imageLabel || item.title}
                          className="w-full h-full object-contain"
                          shape="rounded"
                          radius={8}
                          tone="mauve"
                        />
                      )}
                    </div>

                    {/* Item Bottom Label */}
                    <div className="pt-2 flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold text-purple-deep truncate">
                        {item.title}
                      </span>
                      {item.priceCents != null && (
                        <span className="text-[11px] font-bold text-rose shrink-0">
                          {formatPriceFixed(item.priceCents)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SELECTION CONTROLS & HANDLES */}
                  {isSelected && (
                    <>
                      {/* Top Rotation Handle */}
                      <div
                        onPointerDown={(e) => handleRotatePointerDown(e, item)}
                        className="absolute -top-7 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-rose text-white flex items-center justify-center shadow-md cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
                        title="Drag to rotate"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>

                      {/* 4 Corner Resize Handles */}
                      <div
                        onPointerDown={(e) => handleResizePointerDown(e, item, "nw")}
                        className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-rose rounded-full cursor-nwse-resize shadow-sm hover:scale-125 transition-transform"
                      />
                      <div
                        onPointerDown={(e) => handleResizePointerDown(e, item, "ne")}
                        className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-rose rounded-full cursor-nesw-resize shadow-sm hover:scale-125 transition-transform"
                      />
                      <div
                        onPointerDown={(e) => handleResizePointerDown(e, item, "sw")}
                        className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-rose rounded-full cursor-nesw-resize shadow-sm hover:scale-125 transition-transform"
                      />
                      <div
                        onPointerDown={(e) => handleResizePointerDown(e, item, "se")}
                        className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-rose rounded-full cursor-nwse-resize shadow-sm hover:scale-125 transition-transform"
                      />

                      {/* Floating Item Context Menu Toolbar */}
                      <div
                        className="absolute -top-14 left-1/2 -translate-x-1/2 bg-purple-deep text-white rounded-xl py-1 px-2 flex items-center gap-1 shadow-lg pointer-events-auto z-50 whitespace-nowrap"
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        {/* Rotate 90 deg */}
                        <button
                          onClick={() => rotateItem(item.id, 90)}
                          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                          title="Rotate 90° Clockwise"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>

                        {/* Bring Forward */}
                        <button
                          onClick={() => bringForward(item.id)}
                          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                          title="Bring Forward"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                          </svg>
                        </button>

                        {/* Send Backward */}
                        <button
                          onClick={() => sendBackward(item.id)}
                          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                          title="Send Backward"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={() => duplicateItem(item.id)}
                          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                          title="Duplicate Piece (Ctrl+D)"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                          </svg>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-1.5 hover:bg-rose text-rose hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Delete (Backspace/Del)"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* 1. LOADING STATE WHILE RESTORING SAVED SANDBOX */}
          {!isLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none z-10">
              <div className="relative mb-3 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-3 border-lilac/30 border-t-purple-deep animate-spin" />
                <div className="absolute w-3 h-3 rounded-full bg-rose animate-pulse" />
              </div>
              <h4 className="font-heading text-sm md:text-base font-bold text-purple-deep mb-1">
                {session?.user?.name
                  ? `Restoring ${session.user.name}'s Sandbox...`
                  : "Loading Saved Sandbox..."}
              </h4>
              <p className="text-xs text-tan-dark font-medium">
                Restoring your pieces & layout
              </p>
            </div>
          )}

          {/* 2. EMPTY STATE (SHOWN ONLY ONCE LOADED AND REALLY 0 PIECES) */}
          {isLoaded && items.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none animate-in fade-in duration-300">
              <div className="w-20 h-20 rounded-3xl border-2 border-dashed border-lilac/40 bg-white/70 backdrop-blur-sm flex items-center justify-center mb-4 text-purple-deep shadow-xs">
                <svg className="w-9 h-9 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="font-heading text-xl md:text-2xl font-bold text-purple-deep mb-2">
                Your Fashion Sandbox is Ready
              </h3>
              <p className="text-xs md:text-sm text-tan-dark max-w-md leading-relaxed mb-5">
                Drag pieces from the left drawer or upload photos from your device to start designing your aesthetic moodboard.
              </p>
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="pointer-events-auto inline-flex items-center gap-2 bg-purple-deep text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-purple-deep/90 shadow-sm transition-all cursor-pointer"
              >
                <span>Browse Pieces</span>
                <span>→</span>
              </button>
            </div>
          )}

          {/* INSTRUCTION PILL (TOP-LEFT) */}
          {items.length > 0 && (
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm border border-border px-3.5 py-1.5 rounded-full text-xs font-semibold text-tan-dark shadow-xs flex items-center gap-2 pointer-events-none">
              <svg className="w-3.5 h-3.5 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
              </svg>
              <span>Drag pieces to arrange • Corner handles to scale • Top dot to rotate</span>
            </div>
          )}

          {/* FLOATING BOTTOM CONTROL BAR (ZOOM & UNIFIED COLOR TONES) */}
          <div className="absolute bottom-5 right-5 flex items-center gap-2 bg-white/95 backdrop-blur-md border border-border rounded-2xl p-2 shadow-lg z-20">
            {/* Unified Backdrop Tone Switcher */}
            <div className="flex items-center gap-1.5 border-r border-border pr-2">
              {[
                { id: "cream", bg: "#fbf6f0", label: "Cream" },
                { id: "white", bg: "#ffffff", label: "White" },
                { id: "mauve", bg: "#f6eff8", label: "Mauve" },
                { id: "sage", bg: "#edf4ea", label: "Sage" },
              ].map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setCanvasBg(bg.id as any)}
                  style={{ backgroundColor: bg.bg }}
                  className={`w-5 h-5 rounded-full border border-border transition-transform cursor-pointer ${
                    canvasBg === bg.id ? "ring-2 ring-rose ring-offset-1 scale-110" : "hover:scale-105"
                  }`}
                  title={`${bg.label} Backdrop`}
                />
              ))}
            </div>

            {/* Grid Toggle */}
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                showGrid ? "bg-mauve-100 border-lilac text-purple-deep" : "border-border text-tan-dark hover:bg-mauve-50"
              }`}
              title="Toggle Grid"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>

            {/* Zoom Out (-) */}
            <button
              onClick={zoomOut}
              className="p-1.5 rounded-xl border border-border text-purple-deep hover:bg-mauve-50 transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </button>

            {/* Zoom Percentage */}
            <button
              onClick={resetZoom}
              className="px-2 py-1 rounded-lg text-xs font-bold text-purple-deep hover:bg-mauve-50 transition-colors cursor-pointer"
              title="Click to reset 100%"
            >
              {Math.round(zoom * 100)}%
            </button>

            {/* Zoom In (+) */}
            <button
              onClick={zoomIn}
              className="p-1.5 rounded-xl border border-border text-purple-deep hover:bg-mauve-50 transition-colors cursor-pointer"
              title="Zoom In"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* Reset / Center Pan */}
            <button
              onClick={resetZoom}
              className="p-1.5 rounded-xl border border-border text-purple-deep hover:bg-mauve-50 transition-colors cursor-pointer"
              title="Center Canvas"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </main>
      </div>

      {/* SHARE TO COMMUNITY MODAL */}
      {isShareModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPublishing) {
              setIsShareModalOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col border border-lilac/30 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-gradient-to-r from-mauve-50/70 to-cream">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-deep/10 text-purple-deep flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-purple-deep font-heading">
                    Share Moodboard to Community
                  </h3>
                  <p className="text-[11px] text-tan-dark">
                    Will be published as an interactive image with piece breakdown and sandbox access
                  </p>
                </div>
              </div>

              {!isPublishing && (
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-tan-dark hover:text-purple-deep hover:bg-mauve-50 transition-colors cursor-pointer text-sm"
                  title="Close"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
              {publishSuccess ? (
                <div className="py-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl shadow-inner font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-purple-deep font-heading">
                      Moodboard Published Successfully
                    </h4>
                    <p className="text-xs text-tan-dark mt-1 max-w-sm mx-auto">
                      Your moodboard is now live in the Lilac Drawer community feed. Others can view the full look and explore its pieces.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                    <Link
                      href={`/community/post/${publishSuccess.postId}`}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-deep text-white text-xs font-bold hover:bg-purple-deep/90 shadow-xs transition-all text-center"
                    >
                      View Post in Community
                    </Link>
                    <Link
                      href="/community"
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border text-purple-deep text-xs font-semibold hover:bg-mauve-50 transition-colors text-center"
                    >
                      Browse Community
                    </Link>
                    <button
                      type="button"
                      onClick={() => setIsShareModalOpen(false)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-tan-dark text-xs hover:text-purple-deep transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Image Preview */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-purple-deep">
                      <span>Post Image Preview</span>
                      <span className="text-[11px] text-tan-dark">
                        {items.length} {items.length === 1 ? "Piece" : "Pieces"}
                        {totalLookCents > 0 && ` · Total: ${formatPriceFixed(totalLookCents)}`}
                      </span>
                    </div>

                    <div className="rounded-2xl border border-border/80 bg-mauve-50/40 overflow-hidden flex items-center justify-center relative min-h-[180px] max-h-[260px] p-2">
                      {isGeneratingPreview ? (
                        <div className="flex flex-col items-center gap-2 py-8 text-tan-dark">
                          <span className="w-6 h-6 border-2 border-purple-deep border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs font-medium">Generating high-resolution moodboard preview...</span>
                        </div>
                      ) : sharePreviewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={sharePreviewUrl}
                          alt="Collage Preview"
                          className="max-h-[240px] w-auto max-w-full object-contain rounded-xl shadow-xs"
                        />
                      ) : (
                        <span className="text-xs text-tan italic">Unable to generate preview</span>
                      )}
                    </div>
                  </div>

                  {/* Caption Input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-purple-deep">
                      Add thoughts or styling commentary (optional):
                    </label>
                    <textarea
                      rows={3}
                      value={shareCaption}
                      onChange={(e) => setShareCaption(e.target.value)}
                      placeholder="Share the inspiration behind this look or styling tips with the community..."
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-border bg-mauve-50/40 text-xs text-ink placeholder:text-tan outline-none focus:border-rose focus:bg-white transition-all resize-none"
                    />
                  </div>

                  {/* Error Notification */}
                  {publishError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                      {publishError}
                    </div>
                  )}

                  {/* Modal Footer */}
                  <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-border">
                    <button
                      type="button"
                      disabled={isPublishing}
                      onClick={() => setIsShareModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-tan-dark hover:text-purple-deep hover:bg-mauve-50 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={isPublishing || isGeneratingPreview || !sharePreviewUrl}
                      onClick={handlePublishToCommunity}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-deep to-rose text-white text-xs font-bold hover:opacity-95 shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isPublishing ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Publishing...</span>
                        </>
                      ) : (
                        <>
                          <span>Publish to Community</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
