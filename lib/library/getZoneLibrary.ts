import { 
  fetchContentItems, 
  fetchBloomBooks, 
  fetchCommentariesForChapter, 
  fetchStudyNotesForChapter,
  DbContentItem, 
  BloomBook, 
  BibleCommentary, 
  BibleStudyNote 
} from '../supabase';

export interface LibraryFilters {
  search?: string;
  type?: string;        // 'video' | 'reading' | 'document' | 'book' | 'commentary' | 'note'
  category?: string;    // kids: 'stories' | 'songs' | 'activities'; teens: tags
  book?: string;        // book code
  chapter?: number;     // chapter number
  commentaryId?: string; // 'matthew-henry' | 'adam-clarke' | 'aquifer'
}

export interface ZoneLibraryResult {
  contentItems: DbContentItem[];
  bloomBooks: BloomBook[];
  commentaries: BibleCommentary[];
  studyNotes: BibleStudyNote[];
}

export async function getZoneLibrary(
  zone: 'kids' | 'teens' | 'teachers',
  filters: LibraryFilters = {}
): Promise<ZoneLibraryResult> {
  const result: ZoneLibraryResult = {
    contentItems: [],
    bloomBooks: [],
    commentaries: [],
    studyNotes: []
  };

  try {
    // 1. Fetch content items for specified zone
    let contentStatus: 'published' = 'published';
    const rawItems = await fetchContentItems(zone, undefined, contentStatus);
    result.contentItems = rawItems;

    // Apply search filter on content items
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result.contentItems = result.contentItems.filter(item => 
        item.title?.toLowerCase().includes(searchLower) || 
        item.description?.toLowerCase().includes(searchLower) ||
        (Array.isArray(item.tags) && item.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }

    // Apply type filter
    if (filters.type) {
      result.contentItems = result.contentItems.filter(item => item.type === filters.type);
    }

    // Apply category filter (kids tags or teens topic tags)
    if (filters.category) {
      result.contentItems = contentItemsFilterByCategory(result.contentItems, filters.category);
    }

    // 2. Fetch Kids-specific Bloom Books
    if (zone === 'kids') {
      const books = await fetchBloomBooks();
      result.bloomBooks = books;

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        result.bloomBooks = result.bloomBooks.filter(b => 
          b.title.toLowerCase().includes(searchLower) || 
          b.description?.toLowerCase().includes(searchLower)
        );
      }

      if (filters.category) {
        const categoryLower = filters.category.toLowerCase();
        result.bloomBooks = result.bloomBooks.filter(b => 
          b.age_group?.toLowerCase().includes(categoryLower) ||
          categoryLower === 'stories' // All bloom books are stories
        );
      }
    }

    // 3. Fetch Teachers / Teens passage resources (Study Notes and Commentaries)
    const hasPassage = !!filters.book;
    const targetBook = filters.book || 'MAT';
    const targetChapter = filters.chapter || 1;

    if (zone === 'teens' || zone === 'teachers') {
      // If we have a passage filter, or if we want to fetch comments/notes
      if (hasPassage || filters.type === 'note' || filters.type === 'commentary' || zone === 'teachers') {
        const notes = await fetchStudyNotesForChapter(targetBook, targetChapter);
        result.studyNotes = notes;

        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          result.studyNotes = result.studyNotes.filter(n => 
            n.title.toLowerCase().includes(searchLower) || 
            n.content_html.toLowerCase().includes(searchLower)
          );
        }
      }
    }

    if (zone === 'teachers') {
      if (hasPassage || filters.type === 'commentary' || filters.commentaryId) {
        const commentaries = await fetchCommentariesForChapter(
          targetBook, 
          targetChapter, 
          filters.commentaryId === 'aquifer' ? undefined : filters.commentaryId
        );
        result.commentaries = commentaries;

        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          result.commentaries = result.commentaries.filter(c => 
            c.commentary_name.toLowerCase().includes(searchLower) || 
            c.content.toLowerCase().includes(searchLower)
          );
        }
      }
    }

  } catch (err) {
    console.error("getZoneLibrary Query Error:", err);
  }

  return result;
}

function contentItemsFilterByCategory(items: DbContentItem[], category: string): DbContentItem[] {
  const categoryLower = category.toLowerCase();
  return items.filter(item => {
    // Check tags array first
    if (Array.isArray(item.tags) && item.tags.some(t => t.toLowerCase() === categoryLower)) {
      return true;
    }
    // Check type or generic metadata
    if (item.type === categoryLower) {
      return true;
    }
    // Check categories or tags inside JSON metadata if available
    const metadataStr = JSON.stringify(item.metadata || {});
    return metadataStr.toLowerCase().includes(categoryLower);
  });
}
