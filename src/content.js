// ============================================================
//  NỘI DUNG GAME — sửa chữ, ảnh, nhạc ở đây.
//  Không cần động vào code game. Lưu file là trình duyệt tự tải lại.
// ============================================================

export const CONTENT = {
  title: {
    top: 'GTA',
    main: 'NGÂN CITY',
    badge: '★ 20/10 ★',
    edition: 'Phiên bản: Ngân Rất Bảnh',
    tapToStart: 'CHẠM ĐỂ BẮT ĐẦU',
    soundHint: '🔊 Bật tiếng để trải nghiệm trọn vẹn',
    tips: [
      'Mẹo: Tóc hồng đỏ giúp tăng 200% độ bảnh.',
      'Mẹo: Deadline thì né, trà sữa thì đừng né.',
      'Mẹo: Múa quạt đúng nhịp, cả Ngân City sẽ vỗ tay.',
      'Mẹo: Tộc trưởng gọi thì nhớ nghe máy.',
      'Mẹo: Ngân lượng không mua được sự bảnh, nhưng mua được trà sữa.',
      'Mẹo: Được săn đón quá cũng là một loại áp lực.',
    ],
  },

  tocTruong: {
    name: 'Tộc trưởng',
    status: 'đang hoạt động',
    avatar: '', // tuỳ chọn, VD: 'media/toc-truong.jpg'
  },

  // Tin nhắn của Tộc trưởng: [0] trước phi vụ 1, [1] trước phi vụ 2, [2] trước phi vụ 3, [3] trước thư cuối
  phone: [
    {
      call: true,
      declined: 'Không nghe máy à? Thôi được, anh nhắn vậy 😤',
      messages: [
        'Alo, Ngân đấy à? Anh Tộc trưởng đây.',
        'Hôm nay 20/10 mà cả Ngân City loạn hết cả lên.',
        'Phi vụ đầu tiên: sống sót qua một ngày đi làm.',
        'Deadline, sếp, họp lúc 5h chiều… né hết cho anh. Trà sữa thì cứ hứng thoải mái 🥤',
      ],
      replies: ['Chuyện nhỏ 😎', 'Để em lo!'],
    },
    {
      messages: [
        'Khá lắm! Né deadline còn mượt hơn né tin nhắn sếp lúc 11h đêm.',
        'Giờ cả thành phố đang đồn: chị Ngân múa quạt là nhất.',
        'Lên sàn thôi! Quạt rơi bên trái thì chạm trái, bên phải thì chạm phải.',
      ],
      replies: ['Quẩy luôn! 💃'],
    },
    {
      messages: [
        'Tin nóng: em vừa lên top trending Ngân City 🔥',
        'Tin nóng hơn: cả thành phố đang đuổi theo em… để tặng hoa 🌹',
        'Lên xe đi! Gom đủ 20 bông hồng là xong phi vụ.',
      ],
      replies: ['Lên xe! 🛵'],
    },
    {
      messages: [
        'Phi vụ cuối hoàn tất. Ngân City chính thức công nhận: em là người phụ nữ bảnh nhất thành phố 👑',
        'À, có người nhờ anh chuyển cho em cái này…',
      ],
      replies: ['Mở ra xem 💌'],
    },
  ],

  missions: {
    M1: {
      tag: 'PHI VỤ 1 · NĂM ĐẦU',
      title: 'NÉ DEADLINE',
      hint: 'Kéo ngang để né deadline.\nHứng trà sữa 🥤 và tim 💖',
      duration: 20, // giây
      bad: [
        { icon: 'deadline', label: 'DEADLINE', ouch: 'Ối! Deadline!' },
        { icon: 'boss', label: 'SẾP GỌI', ouch: 'Sếp gọi kìa!' },
        { icon: 'meeting', label: 'HỌP 5H CHIỀU', ouch: 'Lại họp à?!' },
        { icon: 'mail', label: 'MAIL 11H ĐÊM', ouch: 'Mail lúc nửa đêm!' },
      ],
      passed: ['NHAN SẮC +100', 'KỸ NĂNG NÉ DEADLINE: MAX'],
    },
    M2: {
      tag: 'PHI VỤ 2 · NĂM HAI',
      title: 'MÚA QUẠT',
      hint: 'Chạm bên TRÁI / PHẢI màn hình\nđúng lúc quạt rơi vào vòng tròn',
      passed: ['ĐỘ BẢNH +100', 'CẢ NGÂN CITY ĐANG VỖ TAY 👏'],
      notEnough: 'Chưa đủ bảnh! Quẩy lại phát nữa nhé 💃',
    },
    M3: {
      tag: 'PHI VỤ 3 · NĂM BA',
      title: 'SĂN ĐÓN',
      hint: 'Chạm bên trái / phải để đổi làn.\nGom đủ 20 bông hồng 🌹',
      goal: 20,
      passed: ['ĐỘ ĐƯỢC SĂN ĐÓN ★★★★★', 'HOA NHẬN ĐƯỢC: {roses} 🌹'],
    },
  },

  countdown: ['3', '2', '1', 'BẮT ĐẦU!'],

  wasted: {
    title: 'WASTED',
    lines: [
      'Mệt rồi à? Uống ngụm trà sữa rồi thử lại 🥤',
      'Không sao, người bảnh cũng có lúc vấp 😎',
      'Hít thở sâu… chị làm được mà!',
    ],
    retry: 'Thử lại',
    skip: 'Nhờ Tộc trưởng cho qua 👑',
  },

  finale: {
    complete: 'PHÁ ĐẢO NGÂN CITY!',
    stats: [
      'Deadline đã né: {dodged}',
      'Trà sữa đã hứng: {tea} 🥤',
      'Nốt múa quạt "QUÁ BẢNH": {perfect}',
      'Hoa nhận được: {roses} 🌹',
      'Ngân lượng: ${money}',
      'Độ bảnh: ★★★★★ MAX',
    ],
    openLetter: 'Mở thư 💌',

    // ---- Thiệp & lá thư ----
    kicker: 'Ngân City · 20.10.2026',
    heading: 'Chúc mừng 20/10',
    sub: 'Gửi chị Ngân — người phụ nữ bảnh nhất Ngân City',
    letter: [
      'Gửi chị Ngân,',
      'Chúc mừng chị đã phá đảo Ngân City! Né deadline giỏi, múa quạt bảnh, lại còn được cả thành phố săn đón — nói chung là đẳng cấp 😎',
      'Ba năm quen chị, từ hồi còn chung công ty đến giờ, em vẫn luôn thấy: ở đâu có chị là ở đó vui hơn hẳn — chắc là nhờ mái tóc bảy màu biến hóa khôn lường + những câu chuyện vô tri mà chị hay kể :V.',
      '', // ← (tuỳ chọn) thêm một kỷ niệm thật của hai chị em ở đây, VD: 'Em vẫn nhớ hồi…'
      'Cảm ơn chị vì đã luôn là một người chị, một người đồng nghiệp và một đối tác xịn xò.',
      'Nhân ngày 20/10, em chúc chị luôn khỏe, luôn xinh, luôn được yêu thương, làm gì cũng thuận, sống lâu trăm tuổi.',
    ],
    signOff: 'Em,',
    fromName: 'Khách hàng VIP', // ← tên ký cuối thư
  },

  photos: {
    // Ảnh mặt dùng làm đầu nhân vật
    face: 'photos/face.png',
    // 'sticker' = dùng nguyên phần đầu thật (tóc thật) · 'blend' = chỉ lấy mặt, tóc vẽ hoạt hình
    faceMode: 'sticker',
    // Vùng cắt hình bầu dục, tính theo tỉ lệ ảnh (0 → 1). eyes/chin = vị trí mắt và cằm theo chiều dọc.
    faceCrop: { cx: 0.473, cy: 0.462, w: 0.74, h: 0.877, eyes: 0.503, chin: 0.85 },

    // Mặt meme hiện lên khi bị trúng deadline và ở màn WASTED (tuỳ chọn)
    memeFace: 'photos/meme-face.jpg',
    memeFaceCrop: { cx: 0.5, cy: 0.52, w: 0.86, h: 0.86, eyes: 0.45, chin: 0.85 },
    // Ảnh meme hiện ở màn giới thiệu phi vụ 1 (tuỳ chọn)
    memeOffice: 'photos/meme-office.png',

    // Slideshow ở thiệp cuối — ảnh nào chưa có sẽ tự bỏ qua
    memories: [
      { src: 'photos/memory-moon.jpg', caption: 'Chị với tay là chạm tới cả mặt trăng 🌕' },
      { src: 'photos/meme-office.png', caption: 'Ai rồi cũng phải chạy deadline thôi 😵' },
      { src: 'photos/memory-cat.jpg', caption: 'Thiếu ảnh nên lấy tạm ảnh con mèo :V' },
      { src: 'photos/memory-park.jpg', caption: 'Bảnh, nhưng là bảnh dịu dàng ✨' },
      { src: 'photos/face.png', caption: 'Tóc hồng đỏ huyền thoại 💖' },
      { src: 'photos/meme-face.jpg', caption: 'Biểu cảm khi nhận feedback của sếp' },
      { src: 'photos/memory-mirror.jpg', caption: 'Phiên bản Noel vẫn bảnh như thường 🦌' },
    ],
  },

  // Nhạc riêng (tuỳ chọn) — để trống thì dùng nhạc tự tổng hợp
  music: {
    title: '', // VD: 'media/title.mp3'
    finale: '', // VD: 'media/finale.mp3'
    m2: null, // VD: { src: 'media/remix.mp3', bpm: 128, offset: 0.35 }
  },
};
