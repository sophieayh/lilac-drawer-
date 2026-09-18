import Link from "next/link";
import { getAllBanners } from "@/db/queries";
import { deleteBanner } from "@/lib/actions";
import DeleteButton from "@/components/DeleteButton";
import BannerActiveToggle from "@/components/BannerActiveToggle";
import BannerOrderButtons from "@/components/BannerOrderButtons";

export const metadata = { title: "البانرات والإعلانات" };

interface Props {
  searchParams: Promise<{ placement?: string }>;
}

export default async function BannersPage({ searchParams }: Props) {
  const { placement = "all" } = await searchParams;
  const banners = await getAllBanners(placement);

  const activeCount = banners.filter((b) => b.isActive).length;
  const inactiveCount = banners.length - activeCount;

  const filterTabs = [
    { label: "جميع البانرات", value: "all" },
    { label: "شريط مجتمع ليلك التفاعلي", value: "community_banner" },
    { label: "بانر أعلى الصفحة الرئيسية", value: "home_top" },
    { label: "شريط العروض الجانبي", value: "deals_sidebar" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-purple-deep">البانرات والإعلانات</h1>
          <p className="text-sm text-tan-dark mt-1">
            إدارة الحملات الترويجية والبانرات الإعلانية المميزة مع ميزة التمرير التلقائي اللانهائي.
          </p>
        </div>
        <Link
          href="/banners/new"
          className="bg-rose text-white rounded-full px-5 py-2.5 text-sm font-semibold shadow-md hover:bg-rose-dark transition-all"
        >
          + إضافة بانر جديد
        </Link>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-border rounded-2xl p-4.5 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-tan">إجمالي الحملات</div>
          <div className="font-heading text-2xl font-bold text-purple-deep mt-1">{banners.length}</div>
        </div>
        <div className="bg-white border border-border rounded-2xl p-4.5 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">نشط على الموقع</div>
          <div className="font-heading text-2xl font-bold text-emerald-700 mt-1">{activeCount}</div>
        </div>
        <div className="bg-white border border-border rounded-2xl p-4.5 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-tan-dark">متوقف / مسودة</div>
          <div className="font-heading text-2xl font-bold text-tan-dark mt-1">{inactiveCount}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filterTabs.map((tab) => {
          const isActive = placement === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value === "all" ? "/banners" : `/banners?placement=${tab.value}`}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-purple-deep text-white shadow-sm"
                  : "bg-white border border-border text-tan-dark hover:text-purple-deep hover:bg-mauve-50"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Banners Table */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-[var(--shadow-card)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-right text-xs uppercase tracking-wide text-tan-dark bg-mauve-50/50">
              <th className="px-4 py-3.5 font-semibold w-14 text-center">الترتيب</th>
              <th className="px-4 py-3.5 font-semibold w-28">الصورة</th>
              <th className="px-4 py-3.5 font-semibold">البانر والعنوان</th>
              <th className="px-4 py-3.5 font-semibold">الرابط المستهدف</th>
              <th className="px-4 py-3.5 font-semibold">مكان العرض</th>
              <th className="px-4 py-3.5 font-semibold">الحالة</th>
              <th className="px-4 py-3.5 font-semibold text-left">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {banners.map((b, idx) => {
              const isExternal = b.linkUrl.startsWith("http://") || b.linkUrl.startsWith("https://");

              const placementLabel =
                b.placement === "community_banner"
                  ? "شريط مجتمع ليلك"
                  : b.placement === "home_top"
                  ? "أعلى الرئيسية"
                  : b.placement === "deals_sidebar"
                  ? "شريط العروض"
                  : b.placement;

              return (
                <tr
                  key={b.id}
                  className="border-b border-border last:border-b-0 align-middle hover:bg-mauve-50/25 transition-colors"
                >
                  {/* Order controls */}
                  <td className="px-3 py-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <BannerOrderButtons
                        id={b.id}
                        disableUp={idx === 0}
                        disableDown={idx === banners.length - 1}
                      />
                      <span className="text-[11px] font-bold text-tan-dark/70">{b.sortOrder}</span>
                    </div>
                  </td>

                  {/* Thumbnail Image */}
                  <td className="px-4 py-4">
                    <div className="w-24 h-14 rounded-lg overflow-hidden border border-border bg-mauve-100 shrink-0">
                      {b.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={b.imageUrl}
                          alt={b.imageLabel || b.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-tan">
                          لا توجد صورة
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Banner Title, Subtitle, and Badge */}
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1 max-w-[320px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-bold text-purple-deep leading-snug">
                          {b.title}
                        </span>
                        {b.badgeText && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-deep bg-pink-100 px-2 py-0.5 rounded-full">
                            {b.badgeText}
                          </span>
                        )}
                      </div>
                      {b.subtitle && (
                        <p className="text-xs text-tan-dark line-clamp-1">{b.subtitle}</p>
                      )}
                    </div>
                  </td>

                  {/* Target Link */}
                  <td className="px-4 py-4">
                    <a
                      href={b.linkUrl}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                      className="text-xs font-semibold text-rose hover:underline inline-flex items-center gap-1 max-w-[200px] truncate"
                      dir="ltr"
                    >
                      <span className="truncate">{b.linkUrl}</span>
                      <span className="text-xs shrink-0">↗</span>
                    </a>
                  </td>

                  {/* Placement Badge */}
                  <td className="px-4 py-4">
                    <span className="text-xs font-medium text-purple-deep bg-mauve-50 border border-border px-2.5 py-1 rounded-lg">
                      {placementLabel}
                    </span>
                  </td>

                  {/* Active Toggle */}
                  <td className="px-4 py-4">
                    <BannerActiveToggle id={b.id} isActive={b.isActive} />
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4 text-left">
                    <div className="flex items-center justify-start gap-2">
                      <Link
                        href={`/banners/${b.id}/edit`}
                        className="text-xs font-semibold text-purple-deep hover:text-rose px-3 py-1.5 rounded-lg border border-border hover:border-rose transition-colors"
                      >
                        تعديل
                      </Link>
                      <DeleteButton
                        action={deleteBanner.bind(null, b.id)}
                        confirmMessage={`هل أنت متأكد من رغبتك في حذف البانر "${b.title}"؟`}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}

            {banners.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-tan-dark">
                  <div className="max-w-sm mx-auto flex flex-col items-center gap-2">
                    <p className="font-heading text-lg text-purple-deep">لم يتم العثور على أي بانرات</p>
                    <p className="text-xs text-tan mb-2">
                      أنشئ أول حملة إعلانية لتفعيل شريط البانرات التفاعلي على الموقع.
                    </p>
                    <Link
                      href="/banners/new"
                      className="bg-rose text-white rounded-full px-5 py-2 text-xs font-semibold shadow-xs hover:bg-rose-dark transition-all"
                    >
                      + إضافة أول بانر
                    </Link>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
