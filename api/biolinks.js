import express from 'express';
import { authenticateToken } from '../lib/middleware.js';
import { runQuery, getQuery, allQuery } from '../lib/db.js';

const router = express.Router();

router.all('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    if (req.method === 'GET') {
      let settings = await getQuery('biolinks_settings', 'user_id', userId);
      
      if (!settings) {
        const defaults = {
          user_id: userId,
          layout: 'modern',
          bg_effects: 'none',
          bg_effects_color: '#1a1a1c',
          bg_effects_opacity: 100,
          profile_text_color: '#dededd',
          profile_separator_color: '#000000',
          profile_avatar_border: true,
          profile_avatar_border_width: 2,
          profile_avatar_border_color: '#000000',
          profile_view_count: true,
          profile_view_count_icon_color: '#f6f5f4',
          profile_bg_color: '#0a0a0a',
          profile_bg_opacity: 100,
          link_border: true,
          link_border_width: 0,
          link_border_color: '#000000',
          link_border_radius: 50,
          link_text_color: '#6e3e3e',
          link_text_hover_color: '#000000',
          link_icon_color: '#f6f5f4',
          link_icon_hover_color: '#000000',
          link_icon_opacity: 100,
          link_icon_bg_color: '#1e1e1e',
          link_icon_hover_bg_color: '#1e1e1e',
          link_icon_hover_bg_opacity: 100,
          link_icon_glow: true,
          link_icon_glow_size: 0,
          link_icon_glow_color: '#000000',
          link_icon_hover_glow_size: 0,
          link_icon_hover_glow_color: '#000000',
          link_icon_hover_zoom_animation: false,
          link_icon_hover_animation_type: 'none',
          badge_show_hide: true,
          badge_border: true,
          badge_border_width: 0,
          badge_border_color: '#000000',
          badge_border_radius: 50,
          badge_hover_border_color: '#000000',
          badge_hover_border_width: 0,
          badge_hover_border_radius: 50,
          badge_text_color: '#000000',
          badge_text_hover_color: '#000000',
          badge_icon_color: '#f6f5f4',
          badge_icon_hover_color: '#000000',
          badge_icon_opacity: 100,
          badge_icon_background_color: '#1e1e1e',
          badge_icon_hover_background_color: '#1e1e1e',
          badge_icon_hover_bg_opacity: 100,
          badge_icon_glow: true,
          badge_icon_glow_size: 0,
          badge_icon_glow_color: '#000000',
          badge_icon_hover_glow_size: 0,
          badge_icon_hover_glow_color: '#000000',
          badge_icon_hover_zoom_animation: false,
          effects_nickname_effects: 'none',
          effects_description_effects: 'none',
          effects_title_effects: 'none',
          effects_bg_color_click: '#0a0a0a',
          effects_bg_color_opacity: 95,
          effects_username_glow: true,
          effects_username_glow_size: 0,
          effects_click_to_enter: false
        };
        
        try {
          settings = await runQuery('biolinks_settings', defaults);
        } catch (err) {
          console.warn('Could not create default settings:', err.message);
          settings = defaults;
        }
      }
      
      return res.status(200).json({ settings });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const data = req.body;
      
      try {
        let existing = await getQuery('biolinks_settings', 'user_id', userId);
        
        if (existing) {
          const updated = await runQuery(
            'biolinks_settings',
            { ...data, updated_at: new Date().toISOString() },
            'update',
            { column: 'user_id', value: userId }
          );
          return res.status(200).json({ message: 'Settings updated', settings: updated });
        } else {
          const created = await runQuery('biolinks_settings', {
            user_id: userId,
            ...data
          });
          return res.status(201).json({ message: 'Settings created', settings: created });
        }
      } catch (err) {
        console.error('Error updating biolinks settings:', err);
        return res.status(500).json({ error: 'Failed to save settings', details: err.message });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Biolinks API error:', err);
    return res.status(500).json({ error: 'Biolinks operation failed', details: err.message });
  }
});

export default router;
