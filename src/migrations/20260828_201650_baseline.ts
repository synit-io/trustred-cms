import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`users_roles\` (
	\`order\` integer NOT NULL,
	\`parent_id\` integer NOT NULL,
	\`value\` text,
	\`id\` integer PRIMARY KEY NOT NULL,
	FOREIGN KEY (\`parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_roles_order_idx\` ON \`users_roles\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`users_roles_parent_idx\` ON \`users_roles\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`users_sessions\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`created_at\` text,
	\`expires_at\` text NOT NULL,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_sessions_order_idx\` ON \`users_sessions\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX \`users_sessions_parent_id_idx\` ON \`users_sessions\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`users\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`display_name\` text NOT NULL,
	\`department\` text,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`email\` text NOT NULL,
	\`reset_password_token\` text,
	\`reset_password_expiration\` text,
	\`salt\` text,
	\`hash\` text,
	\`login_attempts\` numeric DEFAULT 0,
	\`lock_until\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`media\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`alt\` text NOT NULL,
	\`caption\` text,
	\`category\` text DEFAULT 'general' NOT NULL,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`url\` text,
	\`thumbnail_u_r_l\` text,
	\`filename\` text,
	\`mime_type\` text,
	\`filesize\` numeric,
	\`width\` numeric,
	\`height\` numeric,
	\`focal_x\` numeric,
	\`focal_y\` numeric,
	\`sizes_card_url\` text,
	\`sizes_card_width\` numeric,
	\`sizes_card_height\` numeric,
	\`sizes_card_mime_type\` text,
	\`sizes_card_filesize\` numeric,
	\`sizes_card_filename\` text,
	\`sizes_feature_url\` text,
	\`sizes_feature_width\` numeric,
	\`sizes_feature_height\` numeric,
	\`sizes_feature_mime_type\` text,
	\`sizes_feature_filesize\` numeric,
	\`sizes_feature_filename\` text,
	\`sizes_square_url\` text,
	\`sizes_square_width\` numeric,
	\`sizes_square_height\` numeric,
	\`sizes_square_mime_type\` text,
	\`sizes_square_filesize\` numeric,
	\`sizes_square_filename\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`media_updated_at_idx\` ON \`media\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`media_created_at_idx\` ON \`media\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`media_filename_idx\` ON \`media\` (\`filename\`);`)
  await db.run(
    sql`CREATE INDEX \`media_sizes_card_sizes_card_filename_idx\` ON \`media\` (\`sizes_card_filename\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`media_sizes_feature_sizes_feature_filename_idx\` ON \`media\` (\`sizes_feature_filename\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`media_sizes_square_sizes_square_filename_idx\` ON \`media\` (\`sizes_square_filename\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_hero\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`eyebrow\` text,
	\`headline\` text,
	\`copy\` text,
	\`primary_action_label\` text,
	\`primary_action_href\` text,
	\`secondary_action_label\` text,
	\`secondary_action_href\` text,
	\`hero_image_id\` integer,
	\`block_name\` text,
	FOREIGN KEY (\`hero_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_order_idx\` ON \`pages_blocks_hero\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_parent_id_idx\` ON \`pages_blocks_hero\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_path_idx\` ON \`pages_blocks_hero\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_hero_image_idx\` ON \`pages_blocks_hero\` (\`hero_image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_stats_items\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`value\` text,
	\`label\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_stats\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_stats_items_order_idx\` ON \`pages_blocks_stats_items\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_stats_items_parent_id_idx\` ON \`pages_blocks_stats_items\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_stats\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_stats_order_idx\` ON \`pages_blocks_stats\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_stats_parent_id_idx\` ON \`pages_blocks_stats\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_stats_path_idx\` ON \`pages_blocks_stats\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_rich_text\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`eyebrow\` text,
	\`headline\` text,
	\`copy\` text,
	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_rich_text_order_idx\` ON \`pages_blocks_rich_text\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_rich_text_parent_id_idx\` ON \`pages_blocks_rich_text\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_rich_text_path_idx\` ON \`pages_blocks_rich_text\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_link_grid_links\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`label\` text,
	\`href\` text,
	\`description\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_link_grid\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_link_grid_links_order_idx\` ON \`pages_blocks_link_grid_links\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_link_grid_links_parent_id_idx\` ON \`pages_blocks_link_grid_links\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_link_grid\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`eyebrow\` text,
	\`headline\` text,
	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_link_grid_order_idx\` ON \`pages_blocks_link_grid\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_link_grid_parent_id_idx\` ON \`pages_blocks_link_grid\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_link_grid_path_idx\` ON \`pages_blocks_link_grid\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_feed\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`eyebrow\` text,
	\`headline\` text,
	\`source\` text DEFAULT 'posts',
	\`limit\` numeric DEFAULT 3,
	\`intro\` text,
	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_feed_order_idx\` ON \`pages_blocks_feed\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_feed_parent_id_idx\` ON \`pages_blocks_feed\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_feed_path_idx\` ON \`pages_blocks_feed\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_warnings_dwd_region_ids\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`region_id\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_warnings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_warnings_dwd_region_ids_order_idx\` ON \`pages_blocks_warnings_dwd_region_ids\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_warnings_dwd_region_ids_parent_id_idx\` ON \`pages_blocks_warnings_dwd_region_ids\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_warnings_dwd_states\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`state\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_warnings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_warnings_dwd_states_order_idx\` ON \`pages_blocks_warnings_dwd_states\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_warnings_dwd_states_parent_id_idx\` ON \`pages_blocks_warnings_dwd_states\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_warnings\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`eyebrow\` text,
	\`headline\` text,
	\`provider\` text DEFAULT 'dwd',
	\`preset_key\` text,
	\`nina_preset_key\` text,
	\`intro\` text,
	\`region_label\` text,
	\`forecast_url\` text,
	\`warning_map_url\` text,
	\`weather_map_url\` text,
	\`wildfire_map_url\` text,
	\`show_weather_map\` integer DEFAULT false,
	\`show_wildfire_map\` integer DEFAULT false,
	\`nina_ars\` text,
	\`source_url\` text,
	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_warnings_order_idx\` ON \`pages_blocks_warnings\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_warnings_parent_id_idx\` ON \`pages_blocks_warnings\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_warnings_path_idx\` ON \`pages_blocks_warnings\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_banner\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`label\` text,
	\`title\` text,
	\`text\` text,
	\`primary_label\` text,
	\`primary_href\` text,
	\`secondary_label\` text,
	\`secondary_href\` text,
	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_banner_order_idx\` ON \`pages_blocks_banner\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_banner_parent_id_idx\` ON \`pages_blocks_banner\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_banner_path_idx\` ON \`pages_blocks_banner\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_form\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`eyebrow\` text,
	\`headline\` text,
	\`intro\` text,
	\`form_mode\` text DEFAULT 'preset',
	\`preset_key\` text DEFAULT 'contact',
	\`form_id\` integer,
	\`success_message\` text,
	\`block_name\` text,
	FOREIGN KEY (\`form_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_form_order_idx\` ON \`pages_blocks_form\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_form_parent_id_idx\` ON \`pages_blocks_form\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_form_path_idx\` ON \`pages_blocks_form\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_form_form_idx\` ON \`pages_blocks_form\` (\`form_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_tech_overview\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`eyebrow\` text,
	\`headline\` text,
	\`intro\` text,
	\`featured_equipment_id\` integer,
	\`show_stats\` integer DEFAULT true,
	\`show_featured_profile\` integer DEFAULT true,
	\`max_items\` numeric DEFAULT 12,
	\`block_name\` text,
	FOREIGN KEY (\`featured_equipment_id\`) REFERENCES \`equipment\`(\`id\`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_tech_overview_order_idx\` ON \`pages_blocks_tech_overview\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_tech_overview_parent_id_idx\` ON \`pages_blocks_tech_overview\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_tech_overview_path_idx\` ON \`pages_blocks_tech_overview\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_tech_overview_featured_equipment_idx\` ON \`pages_blocks_tech_overview\` (\`featured_equipment_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_tech_details\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`eyebrow\` text,
	\`headline\` text,
	\`intro\` text,
	\`equipment_id\` integer,
	\`show_compartments\` integer DEFAULT true,
	\`show_highlights\` integer DEFAULT true,
	\`block_name\` text,
	FOREIGN KEY (\`equipment_id\`) REFERENCES \`equipment\`(\`id\`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_tech_details_order_idx\` ON \`pages_blocks_tech_details\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_tech_details_parent_id_idx\` ON \`pages_blocks_tech_details\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_tech_details_path_idx\` ON \`pages_blocks_tech_details\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_tech_details_equipment_idx\` ON \`pages_blocks_tech_details\` (\`equipment_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_operations_log\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`eyebrow\` text,
	\`headline\` text,
	\`intro\` text,
	\`show_stats\` integer DEFAULT true,
	\`show_filters\` integer DEFAULT true,
	\`max_items\` numeric DEFAULT 100,
	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_operations_log_order_idx\` ON \`pages_blocks_operations_log\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_operations_log_parent_id_idx\` ON \`pages_blocks_operations_log\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_operations_log_path_idx\` ON \`pages_blocks_operations_log\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_youtube\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`eyebrow\` text,
	\`headline\` text,
	\`intro\` text,
	\`video_id\` text,
	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_youtube_order_idx\` ON \`pages_blocks_youtube\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_youtube_parent_id_idx\` ON \`pages_blocks_youtube\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_youtube_path_idx\` ON \`pages_blocks_youtube\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_html\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`label\` text,
	\`html\` text,
	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_html_order_idx\` ON \`pages_blocks_html\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_html_parent_id_idx\` ON \`pages_blocks_html\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_html_path_idx\` ON \`pages_blocks_html\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_breadcrumbs\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`doc_id\` integer,
	\`url\` text,
	\`label\` text,
	FOREIGN KEY (\`doc_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_breadcrumbs_order_idx\` ON \`pages_breadcrumbs\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_breadcrumbs_parent_id_idx\` ON \`pages_breadcrumbs\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_breadcrumbs_doc_idx\` ON \`pages_breadcrumbs\` (\`doc_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`title\` text,
	\`slug\` text,
	\`summary\` text,
	\`navigation_label\` text,
	\`show_in_navigation\` integer DEFAULT true,
	\`navigation_order\` numeric DEFAULT 100,
	\`parent_id\` integer,
	\`meta_title\` text,
	\`meta_description\` text,
	\`meta_image_id\` integer,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`_status\` text DEFAULT 'draft',
	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (\`meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_slug_idx\` ON \`pages\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`pages_parent_idx\` ON \`pages\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_meta_meta_image_idx\` ON \`pages\` (\`meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_updated_at_idx\` ON \`pages\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`pages_created_at_idx\` ON \`pages\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`pages__status_idx\` ON \`pages\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_hero\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` integer PRIMARY KEY NOT NULL,
	\`eyebrow\` text,
	\`headline\` text,
	\`copy\` text,
	\`primary_action_label\` text,
	\`primary_action_href\` text,
	\`secondary_action_label\` text,
	\`secondary_action_href\` text,
	\`hero_image_id\` integer,
	\`_uuid\` text,
	\`block_name\` text,
	FOREIGN KEY (\`hero_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_order_idx\` ON \`_pages_v_blocks_hero\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_parent_id_idx\` ON \`_pages_v_blocks_hero\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_path_idx\` ON \`_pages_v_blocks_hero\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_hero_image_idx\` ON \`_pages_v_blocks_hero\` (\`hero_image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_stats_items\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`id\` integer PRIMARY KEY NOT NULL,
	\`value\` text,
	\`label\` text,
	\`_uuid\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_stats\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_stats_items_order_idx\` ON \`_pages_v_blocks_stats_items\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_stats_items_parent_id_idx\` ON \`_pages_v_blocks_stats_items\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_stats\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` integer PRIMARY KEY NOT NULL,
	\`_uuid\` text,
	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_stats_order_idx\` ON \`_pages_v_blocks_stats\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_stats_parent_id_idx\` ON \`_pages_v_blocks_stats\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_stats_path_idx\` ON \`_pages_v_blocks_stats\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_rich_text\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` integer PRIMARY KEY NOT NULL,
	\`eyebrow\` text,
	\`headline\` text,
	\`copy\` text,
	\`_uuid\` text,
	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_rich_text_order_idx\` ON \`_pages_v_blocks_rich_text\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_rich_text_parent_id_idx\` ON \`_pages_v_blocks_rich_text\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_rich_text_path_idx\` ON \`_pages_v_blocks_rich_text\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_link_grid_links\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`id\` integer PRIMARY KEY NOT NULL,
	\`label\` text,
	\`href\` text,
	\`description\` text,
	\`_uuid\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_link_grid\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_link_grid_links_order_idx\` ON \`_pages_v_blocks_link_grid_links\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_link_grid_links_parent_id_idx\` ON \`_pages_v_blocks_link_grid_links\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_link_grid\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` integer PRIMARY KEY NOT NULL,
	\`eyebrow\` text,
	\`headline\` text,
	\`_uuid\` text,
	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_link_grid_order_idx\` ON \`_pages_v_blocks_link_grid\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_link_grid_parent_id_idx\` ON \`_pages_v_blocks_link_grid\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_link_grid_path_idx\` ON \`_pages_v_blocks_link_grid\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_feed\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` integer PRIMARY KEY NOT NULL,
	\`eyebrow\` text,
	\`headline\` text,
	\`source\` text DEFAULT 'posts',
	\`limit\` numeric DEFAULT 3,
	\`intro\` text,
	\`_uuid\` text,
	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_feed_order_idx\` ON \`_pages_v_blocks_feed\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_feed_parent_id_idx\` ON \`_pages_v_blocks_feed\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_feed_path_idx\` ON \`_pages_v_blocks_feed\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_warnings_dwd_region_ids\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`id\` integer PRIMARY KEY NOT NULL,
	\`region_id\` text,
	\`_uuid\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_warnings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_warnings_dwd_region_ids_order_idx\` ON \`_pages_v_blocks_warnings_dwd_region_ids\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_warnings_dwd_region_ids_parent_id_idx\` ON \`_pages_v_blocks_warnings_dwd_region_ids\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_warnings_dwd_states\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`id\` integer PRIMARY KEY NOT NULL,
	\`state\` text,
	\`_uuid\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_warnings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_warnings_dwd_states_order_idx\` ON \`_pages_v_blocks_warnings_dwd_states\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_warnings_dwd_states_parent_id_idx\` ON \`_pages_v_blocks_warnings_dwd_states\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_warnings\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` integer PRIMARY KEY NOT NULL,
	\`eyebrow\` text,
	\`headline\` text,
	\`provider\` text DEFAULT 'dwd',
	\`preset_key\` text,
	\`nina_preset_key\` text,
	\`intro\` text,
	\`region_label\` text,
	\`forecast_url\` text,
	\`warning_map_url\` text,
	\`weather_map_url\` text,
	\`wildfire_map_url\` text,
	\`show_weather_map\` integer DEFAULT false,
	\`show_wildfire_map\` integer DEFAULT false,
	\`nina_ars\` text,
	\`source_url\` text,
	\`_uuid\` text,
	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_warnings_order_idx\` ON \`_pages_v_blocks_warnings\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_warnings_parent_id_idx\` ON \`_pages_v_blocks_warnings\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_warnings_path_idx\` ON \`_pages_v_blocks_warnings\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_banner\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` integer PRIMARY KEY NOT NULL,
	\`label\` text,
	\`title\` text,
	\`text\` text,
	\`primary_label\` text,
	\`primary_href\` text,
	\`secondary_label\` text,
	\`secondary_href\` text,
	\`_uuid\` text,
	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_banner_order_idx\` ON \`_pages_v_blocks_banner\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_banner_parent_id_idx\` ON \`_pages_v_blocks_banner\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_banner_path_idx\` ON \`_pages_v_blocks_banner\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_form\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` integer PRIMARY KEY NOT NULL,
	\`eyebrow\` text,
	\`headline\` text,
	\`intro\` text,
	\`form_mode\` text DEFAULT 'preset',
	\`preset_key\` text DEFAULT 'contact',
	\`form_id\` integer,
	\`success_message\` text,
	\`_uuid\` text,
	\`block_name\` text,
	FOREIGN KEY (\`form_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_form_order_idx\` ON \`_pages_v_blocks_form\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_form_parent_id_idx\` ON \`_pages_v_blocks_form\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_form_path_idx\` ON \`_pages_v_blocks_form\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_form_form_idx\` ON \`_pages_v_blocks_form\` (\`form_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_tech_overview\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` integer PRIMARY KEY NOT NULL,
	\`eyebrow\` text,
	\`headline\` text,
	\`intro\` text,
	\`featured_equipment_id\` integer,
	\`show_stats\` integer DEFAULT true,
	\`show_featured_profile\` integer DEFAULT true,
	\`max_items\` numeric DEFAULT 12,
	\`_uuid\` text,
	\`block_name\` text,
	FOREIGN KEY (\`featured_equipment_id\`) REFERENCES \`equipment\`(\`id\`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_tech_overview_order_idx\` ON \`_pages_v_blocks_tech_overview\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_tech_overview_parent_id_idx\` ON \`_pages_v_blocks_tech_overview\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_tech_overview_path_idx\` ON \`_pages_v_blocks_tech_overview\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_tech_overview_featured_equipment_idx\` ON \`_pages_v_blocks_tech_overview\` (\`featured_equipment_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_tech_details\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` integer PRIMARY KEY NOT NULL,
	\`eyebrow\` text,
	\`headline\` text,
	\`intro\` text,
	\`equipment_id\` integer,
	\`show_compartments\` integer DEFAULT true,
	\`show_highlights\` integer DEFAULT true,
	\`_uuid\` text,
	\`block_name\` text,
	FOREIGN KEY (\`equipment_id\`) REFERENCES \`equipment\`(\`id\`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_tech_details_order_idx\` ON \`_pages_v_blocks_tech_details\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_tech_details_parent_id_idx\` ON \`_pages_v_blocks_tech_details\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_tech_details_path_idx\` ON \`_pages_v_blocks_tech_details\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_tech_details_equipment_idx\` ON \`_pages_v_blocks_tech_details\` (\`equipment_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_operations_log\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` integer PRIMARY KEY NOT NULL,
	\`eyebrow\` text,
	\`headline\` text,
	\`intro\` text,
	\`show_stats\` integer DEFAULT true,
	\`show_filters\` integer DEFAULT true,
	\`max_items\` numeric DEFAULT 100,
	\`_uuid\` text,
	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_operations_log_order_idx\` ON \`_pages_v_blocks_operations_log\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_operations_log_parent_id_idx\` ON \`_pages_v_blocks_operations_log\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_operations_log_path_idx\` ON \`_pages_v_blocks_operations_log\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_youtube\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` integer PRIMARY KEY NOT NULL,
	\`eyebrow\` text,
	\`headline\` text,
	\`intro\` text,
	\`video_id\` text,
	\`_uuid\` text,
	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_youtube_order_idx\` ON \`_pages_v_blocks_youtube\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_youtube_parent_id_idx\` ON \`_pages_v_blocks_youtube\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_youtube_path_idx\` ON \`_pages_v_blocks_youtube\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_html\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` integer PRIMARY KEY NOT NULL,
	\`label\` text,
	\`html\` text,
	\`_uuid\` text,
	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_html_order_idx\` ON \`_pages_v_blocks_html\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_html_parent_id_idx\` ON \`_pages_v_blocks_html\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_html_path_idx\` ON \`_pages_v_blocks_html\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_version_breadcrumbs\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`id\` integer PRIMARY KEY NOT NULL,
	\`doc_id\` integer,
	\`url\` text,
	\`label\` text,
	\`_uuid\` text,
	FOREIGN KEY (\`doc_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_breadcrumbs_order_idx\` ON \`_pages_v_version_breadcrumbs\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_breadcrumbs_parent_id_idx\` ON \`_pages_v_version_breadcrumbs\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_breadcrumbs_doc_idx\` ON \`_pages_v_version_breadcrumbs\` (\`doc_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`parent_id\` integer,
	\`version_title\` text,
	\`version_slug\` text,
	\`version_summary\` text,
	\`version_navigation_label\` text,
	\`version_show_in_navigation\` integer DEFAULT true,
	\`version_navigation_order\` numeric DEFAULT 100,
	\`version_parent_id\` integer,
	\`version_meta_title\` text,
	\`version_meta_description\` text,
	\`version_meta_image_id\` integer,
	\`version_updated_at\` text,
	\`version_created_at\` text,
	\`version__status\` text DEFAULT 'draft',
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`latest\` integer,
	\`autosave\` integer,
	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (\`version_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (\`version_meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_parent_idx\` ON \`_pages_v\` (\`parent_id\`);`)
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_version_slug_idx\` ON \`_pages_v\` (\`version_slug\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_version_parent_idx\` ON \`_pages_v\` (\`version_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_meta_version_meta_image_idx\` ON \`_pages_v\` (\`version_meta_image_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_version_updated_at_idx\` ON \`_pages_v\` (\`version_updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_version_created_at_idx\` ON \`_pages_v\` (\`version_created_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_version__status_idx\` ON \`_pages_v\` (\`version__status\`);`,
  )
  await db.run(sql`CREATE INDEX \`_pages_v_created_at_idx\` ON \`_pages_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_updated_at_idx\` ON \`_pages_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_latest_idx\` ON \`_pages_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_autosave_idx\` ON \`_pages_v\` (\`autosave\`);`)
  await db.run(sql`CREATE TABLE \`posts\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`title\` text,
	\`slug\` text,
	\`category\` text DEFAULT 'oeffentlichkeitsarbeit',
	\`excerpt\` text,
	\`content\` text,
	\`featured_image_id\` integer,
	\`show_image_placeholder\` integer DEFAULT false,
	\`published_at\` text,
	\`meta_title\` text,
	\`meta_description\` text,
	\`meta_image_id\` integer,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`_status\` text DEFAULT 'draft',
	FOREIGN KEY (\`featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (\`meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`posts_slug_idx\` ON \`posts\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`posts_featured_image_idx\` ON \`posts\` (\`featured_image_id\`);`)
  await db.run(sql`CREATE INDEX \`posts_meta_meta_image_idx\` ON \`posts\` (\`meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`posts_updated_at_idx\` ON \`posts\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`posts_created_at_idx\` ON \`posts\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`posts__status_idx\` ON \`posts\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_posts_v\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`parent_id\` integer,
	\`version_title\` text,
	\`version_slug\` text,
	\`version_category\` text DEFAULT 'oeffentlichkeitsarbeit',
	\`version_excerpt\` text,
	\`version_content\` text,
	\`version_featured_image_id\` integer,
	\`version_show_image_placeholder\` integer DEFAULT false,
	\`version_published_at\` text,
	\`version_meta_title\` text,
	\`version_meta_description\` text,
	\`version_meta_image_id\` integer,
	\`version_updated_at\` text,
	\`version_created_at\` text,
	\`version__status\` text DEFAULT 'draft',
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`latest\` integer,
	FOREIGN KEY (\`parent_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (\`version_featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (\`version_meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_posts_v_parent_idx\` ON \`_posts_v\` (\`parent_id\`);`)
  await db.run(
    sql`CREATE INDEX \`_posts_v_version_version_slug_idx\` ON \`_posts_v\` (\`version_slug\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_posts_v_version_version_featured_image_idx\` ON \`_posts_v\` (\`version_featured_image_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_posts_v_version_meta_version_meta_image_idx\` ON \`_posts_v\` (\`version_meta_image_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_posts_v_version_version_updated_at_idx\` ON \`_posts_v\` (\`version_updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_posts_v_version_version_created_at_idx\` ON \`_posts_v\` (\`version_created_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_posts_v_version_version__status_idx\` ON \`_posts_v\` (\`version__status\`);`,
  )
  await db.run(sql`CREATE INDEX \`_posts_v_created_at_idx\` ON \`_posts_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_posts_v_updated_at_idx\` ON \`_posts_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_posts_v_latest_idx\` ON \`_posts_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`events\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`title\` text NOT NULL,
	\`slug\` text NOT NULL,
	\`event_type\` text NOT NULL,
	\`visibility\` text DEFAULT 'public' NOT NULL,
	\`starts_at\` text NOT NULL,
	\`ends_at\` text,
	\`location\` text NOT NULL,
	\`summary\` text NOT NULL,
	\`featured_image_id\` integer,
	\`show_image_placeholder\` integer DEFAULT false,
	\`registration_enabled\` integer DEFAULT false,
	\`meta_title\` text,
	\`meta_description\` text,
	\`meta_image_id\` integer,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (\`featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (\`meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`events_slug_idx\` ON \`events\` (\`slug\`);`)
  await db.run(
    sql`CREATE INDEX \`events_featured_image_idx\` ON \`events\` (\`featured_image_id\`);`,
  )
  await db.run(sql`CREATE INDEX \`events_meta_meta_image_idx\` ON \`events\` (\`meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`events_updated_at_idx\` ON \`events\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`events_created_at_idx\` ON \`events\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`operations_units_involved\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`unit\` text NOT NULL,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`operations\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`operations_units_involved_order_idx\` ON \`operations_units_involved\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`operations_units_involved_parent_id_idx\` ON \`operations_units_involved\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`operations\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`operation_number\` text NOT NULL,
	\`alarm_code\` text NOT NULL,
	\`category\` text NOT NULL,
	\`started_at\` text NOT NULL,
	\`location\` text NOT NULL,
	\`summary\` text NOT NULL,
	\`details\` text,
	\`featured_image_id\` integer,
	\`show_image_placeholder\` integer DEFAULT false,
	\`is_public\` integer DEFAULT true,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (\`featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX \`operations_operation_number_idx\` ON \`operations\` (\`operation_number\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`operations_featured_image_idx\` ON \`operations\` (\`featured_image_id\`);`,
  )
  await db.run(sql`CREATE INDEX \`operations_updated_at_idx\` ON \`operations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`operations_created_at_idx\` ON \`operations\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`crew_skills\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`label\` text NOT NULL,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`crew\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`crew_skills_order_idx\` ON \`crew_skills\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`crew_skills_parent_id_idx\` ON \`crew_skills\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`crew\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`name\` text NOT NULL,
	\`role\` text NOT NULL,
	\`qualification\` text,
	\`focus\` text,
	\`portrait_id\` integer,
	\`show_image_placeholder\` integer DEFAULT false,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (\`portrait_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`crew_portrait_idx\` ON \`crew\` (\`portrait_id\`);`)
  await db.run(sql`CREATE INDEX \`crew_updated_at_idx\` ON \`crew\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`crew_created_at_idx\` ON \`crew\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`equipment_facts\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`label\` text NOT NULL,
	\`value\` text NOT NULL,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`equipment\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`equipment_facts_order_idx\` ON \`equipment_facts\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX \`equipment_facts_parent_id_idx\` ON \`equipment_facts\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`equipment_highlights\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`title\` text NOT NULL,
	\`description\` text NOT NULL,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`equipment\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`equipment_highlights_order_idx\` ON \`equipment_highlights\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`equipment_highlights_parent_id_idx\` ON \`equipment_highlights\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`equipment_compartments_contents\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`label\` text NOT NULL,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`equipment_compartments\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`equipment_compartments_contents_order_idx\` ON \`equipment_compartments_contents\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`equipment_compartments_contents_parent_id_idx\` ON \`equipment_compartments_contents\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`equipment_compartments\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`code\` text NOT NULL,
	\`title\` text NOT NULL,
	\`description\` text,
	\`image_id\` integer,
	\`show_image_placeholder\` integer DEFAULT false,
	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`equipment\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`equipment_compartments_order_idx\` ON \`equipment_compartments\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`equipment_compartments_parent_id_idx\` ON \`equipment_compartments\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`equipment_compartments_image_idx\` ON \`equipment_compartments\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`equipment\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`name\` text NOT NULL,
	\`slug\` text NOT NULL,
	\`call_sign\` text,
	\`summary\` text NOT NULL,
	\`hero_image_id\` integer,
	\`meta_title\` text,
	\`meta_description\` text,
	\`meta_image_id\` integer,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (\`hero_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (\`meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`equipment_slug_idx\` ON \`equipment\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`equipment_hero_image_idx\` ON \`equipment\` (\`hero_image_id\`);`)
  await db.run(
    sql`CREATE INDEX \`equipment_meta_meta_image_idx\` ON \`equipment\` (\`meta_image_id\`);`,
  )
  await db.run(sql`CREATE INDEX \`equipment_updated_at_idx\` ON \`equipment\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`equipment_created_at_idx\` ON \`equipment\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`faqs\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`question\` text NOT NULL,
	\`answer\` text NOT NULL,
	\`category\` text,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`faqs_updated_at_idx\` ON \`faqs\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`faqs_created_at_idx\` ON \`faqs\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`warning_presets_dwd_region_ids\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`region_id\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`warning_presets\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`warning_presets_dwd_region_ids_order_idx\` ON \`warning_presets_dwd_region_ids\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`warning_presets_dwd_region_ids_parent_id_idx\` ON \`warning_presets_dwd_region_ids\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`warning_presets_dwd_states\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`state\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`warning_presets\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`warning_presets_dwd_states_order_idx\` ON \`warning_presets_dwd_states\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`warning_presets_dwd_states_parent_id_idx\` ON \`warning_presets_dwd_states\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`warning_presets\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`key\` text NOT NULL,
	\`label\` text NOT NULL,
	\`provider\` text NOT NULL,
	\`region_label\` text NOT NULL,
	\`is_system_preset\` integer DEFAULT false NOT NULL,
	\`forecast_url\` text,
	\`warning_map_url\` text,
	\`weather_map_url\` text,
	\`wildfire_map_url\` text,
	\`nina_ars\` text,
	\`source_url\` text,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX \`warning_presets_key_idx\` ON \`warning_presets\` (\`key\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`warning_presets_updated_at_idx\` ON \`warning_presets\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`warning_presets_created_at_idx\` ON \`warning_presets\` (\`created_at\`);`,
  )
  await db.run(sql`CREATE TABLE \`forms_blocks_checkbox\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`name\` text NOT NULL,
	\`label\` text,
	\`width\` numeric,
	\`required\` integer,
	\`default_value\` integer,
	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`forms_blocks_checkbox_order_idx\` ON \`forms_blocks_checkbox\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`forms_blocks_checkbox_parent_id_idx\` ON \`forms_blocks_checkbox\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`forms_blocks_checkbox_path_idx\` ON \`forms_blocks_checkbox\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`forms_blocks_country\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`name\` text NOT NULL,
	\`label\` text,
	\`width\` numeric,
	\`required\` integer,
	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`forms_blocks_country_order_idx\` ON \`forms_blocks_country\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`forms_blocks_country_parent_id_idx\` ON \`forms_blocks_country\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`forms_blocks_country_path_idx\` ON \`forms_blocks_country\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`forms_blocks_email\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`name\` text NOT NULL,
	\`label\` text,
	\`width\` numeric,
	\`required\` integer,
	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`forms_blocks_email_order_idx\` ON \`forms_blocks_email\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`forms_blocks_email_parent_id_idx\` ON \`forms_blocks_email\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`forms_blocks_email_path_idx\` ON \`forms_blocks_email\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`forms_blocks_message\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`message\` text,
	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`forms_blocks_message_order_idx\` ON \`forms_blocks_message\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`forms_blocks_message_parent_id_idx\` ON \`forms_blocks_message\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`forms_blocks_message_path_idx\` ON \`forms_blocks_message\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`forms_blocks_number\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`name\` text NOT NULL,
	\`label\` text,
	\`width\` numeric,
	\`default_value\` numeric,
	\`required\` integer,
	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`forms_blocks_number_order_idx\` ON \`forms_blocks_number\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`forms_blocks_number_parent_id_idx\` ON \`forms_blocks_number\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`forms_blocks_number_path_idx\` ON \`forms_blocks_number\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`forms_blocks_select_options\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`label\` text NOT NULL,
	\`value\` text NOT NULL,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`forms_blocks_select\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`forms_blocks_select_options_order_idx\` ON \`forms_blocks_select_options\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`forms_blocks_select_options_parent_id_idx\` ON \`forms_blocks_select_options\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`forms_blocks_select\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`name\` text NOT NULL,
	\`label\` text,
	\`width\` numeric,
	\`default_value\` text,
	\`placeholder\` text,
	\`required\` integer,
	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`forms_blocks_select_order_idx\` ON \`forms_blocks_select\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`forms_blocks_select_parent_id_idx\` ON \`forms_blocks_select\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`forms_blocks_select_path_idx\` ON \`forms_blocks_select\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`forms_blocks_state\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`name\` text NOT NULL,
	\`label\` text,
	\`width\` numeric,
	\`required\` integer,
	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`forms_blocks_state_order_idx\` ON \`forms_blocks_state\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`forms_blocks_state_parent_id_idx\` ON \`forms_blocks_state\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`forms_blocks_state_path_idx\` ON \`forms_blocks_state\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`forms_blocks_text\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`name\` text NOT NULL,
	\`label\` text,
	\`width\` numeric,
	\`default_value\` text,
	\`required\` integer,
	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`forms_blocks_text_order_idx\` ON \`forms_blocks_text\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`forms_blocks_text_parent_id_idx\` ON \`forms_blocks_text\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`forms_blocks_text_path_idx\` ON \`forms_blocks_text\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`forms_blocks_textarea\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`_path\` text NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`name\` text NOT NULL,
	\`label\` text,
	\`width\` numeric,
	\`default_value\` text,
	\`required\` integer,
	\`block_name\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`forms_blocks_textarea_order_idx\` ON \`forms_blocks_textarea\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`forms_blocks_textarea_parent_id_idx\` ON \`forms_blocks_textarea\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`forms_blocks_textarea_path_idx\` ON \`forms_blocks_textarea\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`forms_emails\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`email_to\` text,
	\`cc\` text,
	\`bcc\` text,
	\`reply_to\` text,
	\`email_from\` text,
	\`subject\` text DEFAULT 'You''ve received a new message.' NOT NULL,
	\`message\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`forms_emails_order_idx\` ON \`forms_emails\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX \`forms_emails_parent_id_idx\` ON \`forms_emails\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`forms\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`title\` text NOT NULL,
	\`submit_button_label\` text,
	\`confirmation_type\` text DEFAULT 'message',
	\`confirmation_message\` text,
	\`redirect_url\` text,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`forms_updated_at_idx\` ON \`forms\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`forms_created_at_idx\` ON \`forms\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`form_submissions_submission_data\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`field\` text NOT NULL,
	\`value\` text NOT NULL,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`form_submissions\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`form_submissions_submission_data_order_idx\` ON \`form_submissions_submission_data\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`form_submissions_submission_data_parent_id_idx\` ON \`form_submissions_submission_data\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`form_submissions\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`form_id\` integer NOT NULL,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (\`form_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(
    sql`CREATE INDEX \`form_submissions_form_idx\` ON \`form_submissions\` (\`form_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`form_submissions_updated_at_idx\` ON \`form_submissions\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`form_submissions_created_at_idx\` ON \`form_submissions\` (\`created_at\`);`,
  )
  await db.run(sql`CREATE TABLE \`payload_kv\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`key\` text NOT NULL,
	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`global_slug\` text,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`,
  )
  await db.run(sql`CREATE TABLE \`payload_locked_documents_rels\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`order\` integer,
	\`parent_id\` integer NOT NULL,
	\`path\` text NOT NULL,
	\`users_id\` integer,
	\`media_id\` integer,
	\`pages_id\` integer,
	\`posts_id\` integer,
	\`events_id\` integer,
	\`operations_id\` integer,
	\`crew_id\` integer,
	\`equipment_id\` integer,
	\`faqs_id\` integer,
	\`warning_presets_id\` integer,
	\`forms_id\` integer,
	\`form_submissions_id\` integer,
	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`events_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`operations_id\`) REFERENCES \`operations\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`crew_id\`) REFERENCES \`crew\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`equipment_id\`) REFERENCES \`equipment\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`faqs_id\`) REFERENCES \`faqs\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`warning_presets_id\`) REFERENCES \`warning_presets\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`forms_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`form_submissions_id\`) REFERENCES \`form_submissions\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_posts_id_idx\` ON \`payload_locked_documents_rels\` (\`posts_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_events_id_idx\` ON \`payload_locked_documents_rels\` (\`events_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_operations_id_idx\` ON \`payload_locked_documents_rels\` (\`operations_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_crew_id_idx\` ON \`payload_locked_documents_rels\` (\`crew_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_equipment_id_idx\` ON \`payload_locked_documents_rels\` (\`equipment_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_faqs_id_idx\` ON \`payload_locked_documents_rels\` (\`faqs_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_warning_presets_id_idx\` ON \`payload_locked_documents_rels\` (\`warning_presets_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_forms_id_idx\` ON \`payload_locked_documents_rels\` (\`forms_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_form_submissions_id_idx\` ON \`payload_locked_documents_rels\` (\`form_submissions_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`payload_preferences\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`key\` text,
	\`value\` text,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(
    sql`CREATE INDEX \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`,
  )
  await db.run(sql`CREATE TABLE \`payload_preferences_rels\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`order\` integer,
	\`parent_id\` integer NOT NULL,
	\`path\` text NOT NULL,
	\`users_id\` integer,
	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`payload_migrations\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`name\` text,
	\`batch\` numeric,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(
    sql`CREATE INDEX \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`,
  )
  await db.run(sql`CREATE TABLE \`site_settings\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`site_name\` text DEFAULT 'Freiwillige Feuerwehr Musterstadt' NOT NULL,
	\`department_name\` text DEFAULT 'Musterstadt' NOT NULL,
	\`tagline_primary\` text DEFAULT 'Retten. Löschen. Bergen. Schützen.',
	\`tagline_secondary\` text DEFAULT 'Ehrenamtlich im Einsatz - verlässlich für alle.',
	\`announcement_enabled\` integer DEFAULT true,
	\`announcement_label\` text DEFAULT 'Hinweis',
	\`announcement_message\` text DEFAULT 'Heute 19:30 Uhr Übungsdienst. Treffpunkt Feuerwehrhaus Musterstadt. Interessierte sind als Gäste willkommen.',
	\`theme_brand_color\` text DEFAULT '#871d33',
	\`theme_brand_color_strong\` text DEFAULT '#6d1729',
	\`theme_surface_color\` text DEFAULT '#f7f7f4',
	\`join_button_label\` text DEFAULT 'Mitmachen',
	\`join_button_href\` text DEFAULT '/mitmachen',
	\`contact_email\` text DEFAULT 'info@ffw-musterstadt.de',
	\`contact_emergency_number\` text DEFAULT '112',
	\`contact_address\` text DEFAULT 'Musterweg 1
  00000 Musterstadt',
	\`legal_organization_name\` text DEFAULT 'Freiwillige Feuerwehr Musterstadt',
	\`legal_responsible_person\` text,
	\`legal_imprint_text\` text,
	\`smtp_enabled\` integer DEFAULT false,
	\`smtp_host\` text,
	\`smtp_port\` numeric DEFAULT 587,
	\`smtp_secure\` integer DEFAULT false,
	\`smtp_username\` text,
	\`smtp_password\` text,
	\`smtp_from_name\` text,
	\`smtp_from_email\` text,
	\`smtp_ignore_t_l_s\` integer DEFAULT false,
	\`smtp_require_t_l_s\` integer DEFAULT false,
	\`smtp_skip_verify\` integer DEFAULT false,
	\`meta_title\` text,
	\`meta_description\` text,
	\`meta_image_id\` integer,
	\`updated_at\` text,
	\`created_at\` text,
	FOREIGN KEY (\`meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(
    sql`CREATE INDEX \`site_settings_meta_meta_image_idx\` ON \`site_settings\` (\`meta_image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`setup_state\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`status\` text DEFAULT 'not_started' NOT NULL,
	\`current_step\` text DEFAULT 'admin',
	\`completed_at\` text,
	\`skipped_at\` text,
	\`completed_by_id\` integer,
	\`version\` numeric DEFAULT 1 NOT NULL,
	\`updated_at\` text,
	\`created_at\` text,
	FOREIGN KEY (\`completed_by_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(
    sql`CREATE INDEX \`setup_state_completed_by_idx\` ON \`setup_state\` (\`completed_by_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`users_roles\`;`)
  await db.run(sql`DROP TABLE \`users_sessions\`;`)
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`DROP TABLE \`media\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_hero\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_stats_items\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_stats\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_rich_text\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_link_grid_links\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_link_grid\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_feed\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_warnings_dwd_region_ids\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_warnings_dwd_states\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_warnings\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_banner\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_form\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_tech_overview\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_tech_details\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_operations_log\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_youtube\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_html\`;`)
  await db.run(sql`DROP TABLE \`pages_breadcrumbs\`;`)
  await db.run(sql`DROP TABLE \`pages\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_stats_items\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_stats\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_rich_text\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_link_grid_links\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_link_grid\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_feed\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_warnings_dwd_region_ids\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_warnings_dwd_states\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_warnings\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_banner\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_form\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_tech_overview\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_tech_details\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_operations_log\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_youtube\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_html\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_version_breadcrumbs\`;`)
  await db.run(sql`DROP TABLE \`_pages_v\`;`)
  await db.run(sql`DROP TABLE \`posts\`;`)
  await db.run(sql`DROP TABLE \`_posts_v\`;`)
  await db.run(sql`DROP TABLE \`events\`;`)
  await db.run(sql`DROP TABLE \`operations_units_involved\`;`)
  await db.run(sql`DROP TABLE \`operations\`;`)
  await db.run(sql`DROP TABLE \`crew_skills\`;`)
  await db.run(sql`DROP TABLE \`crew\`;`)
  await db.run(sql`DROP TABLE \`equipment_facts\`;`)
  await db.run(sql`DROP TABLE \`equipment_highlights\`;`)
  await db.run(sql`DROP TABLE \`equipment_compartments_contents\`;`)
  await db.run(sql`DROP TABLE \`equipment_compartments\`;`)
  await db.run(sql`DROP TABLE \`equipment\`;`)
  await db.run(sql`DROP TABLE \`faqs\`;`)
  await db.run(sql`DROP TABLE \`warning_presets_dwd_region_ids\`;`)
  await db.run(sql`DROP TABLE \`warning_presets_dwd_states\`;`)
  await db.run(sql`DROP TABLE \`warning_presets\`;`)
  await db.run(sql`DROP TABLE \`forms_blocks_checkbox\`;`)
  await db.run(sql`DROP TABLE \`forms_blocks_country\`;`)
  await db.run(sql`DROP TABLE \`forms_blocks_email\`;`)
  await db.run(sql`DROP TABLE \`forms_blocks_message\`;`)
  await db.run(sql`DROP TABLE \`forms_blocks_number\`;`)
  await db.run(sql`DROP TABLE \`forms_blocks_select_options\`;`)
  await db.run(sql`DROP TABLE \`forms_blocks_select\`;`)
  await db.run(sql`DROP TABLE \`forms_blocks_state\`;`)
  await db.run(sql`DROP TABLE \`forms_blocks_text\`;`)
  await db.run(sql`DROP TABLE \`forms_blocks_textarea\`;`)
  await db.run(sql`DROP TABLE \`forms_emails\`;`)
  await db.run(sql`DROP TABLE \`forms\`;`)
  await db.run(sql`DROP TABLE \`form_submissions_submission_data\`;`)
  await db.run(sql`DROP TABLE \`form_submissions\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_migrations\`;`)
  await db.run(sql`DROP TABLE \`site_settings\`;`)
  await db.run(sql`DROP TABLE \`setup_state\`;`)
}
