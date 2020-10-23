
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function compute_rest_props(props, keys) {
        const rest = {};
        keys = new Set(keys);
        for (const k in props)
            if (!keys.has(k) && k[0] !== '$')
                rest[k] = props[k];
        return rest;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function set_svg_attributes(node, attributes) {
        for (const key in attributes) {
            attr(node, key, attributes[key]);
        }
    }
    function xlink_attr(node, attribute, value) {
        node.setAttributeNS('http://www.w3.org/1999/xlink', attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.28.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function getEventsAction(component) {
        return node => {
          const events = Object.keys(component.$$.callbacks);
          const listeners = [];

          events.forEach(
              event => listeners.push(
                  listen(node, event, e =>  bubble(component, e))
                )
            );
      
          return {
            destroy: () => {
                listeners.forEach(
                    listener => listener()
                );
            }
          }
        };
    }

    /* node_modules\svelte-chota\cmp\Container.svelte generated by Svelte v3.28.0 */
    const file = "node_modules\\svelte-chota\\cmp\\Container.svelte";

    function create_fragment(ctx) {
    	let div;
    	let events_action;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);
    	let div_levels = [/*$$restProps*/ ctx[1]];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			toggle_class(div, "container", 1);
    			add_location(div, file, 7, 0, 167);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(events_action = /*events*/ ctx[0].call(null, div));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1]]));
    			toggle_class(div, "container", 1);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	const omit_props_names = [];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Container", slots, ['default']);
    	const events = getEventsAction(current_component);

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("$$scope" in $$new_props) $$invalidate(2, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getEventsAction,
    		current_component,
    		events
    	});

    	return [events, $$restProps, $$scope, slots];
    }

    class Container extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Container",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* node_modules\svelte-chota\cmp\Card.svelte generated by Svelte v3.28.0 */
    const file$1 = "node_modules\\svelte-chota\\cmp\\Card.svelte";
    const get_footer_slot_changes = dirty => ({});
    const get_footer_slot_context = ctx => ({});
    const get_header_slot_changes = dirty => ({});
    const get_header_slot_context = ctx => ({});

    // (12:0) {#if is_header}
    function create_if_block_1(ctx) {
    	let header;
    	let current;
    	const header_slot_template = /*#slots*/ ctx[5].header;
    	const header_slot = create_slot(header_slot_template, ctx, /*$$scope*/ ctx[4], get_header_slot_context);

    	const block = {
    		c: function create() {
    			header = element("header");
    			if (header_slot) header_slot.c();
    			add_location(header, file$1, 12, 1, 392);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);

    			if (header_slot) {
    				header_slot.m(header, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (header_slot) {
    				if (header_slot.p && dirty & /*$$scope*/ 16) {
    					update_slot(header_slot, header_slot_template, ctx, /*$$scope*/ ctx[4], dirty, get_header_slot_changes, get_header_slot_context);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (header_slot) header_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(12:0) {#if is_header}",
    		ctx
    	});

    	return block;
    }

    // (18:0) {#if is_footer}
    function create_if_block(ctx) {
    	let footer;
    	let current;
    	const footer_slot_template = /*#slots*/ ctx[5].footer;
    	const footer_slot = create_slot(footer_slot_template, ctx, /*$$scope*/ ctx[4], get_footer_slot_context);

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			if (footer_slot) footer_slot.c();
    			add_location(footer, file$1, 18, 1, 485);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);

    			if (footer_slot) {
    				footer_slot.m(footer, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (footer_slot) {
    				if (footer_slot.p && dirty & /*$$scope*/ 16) {
    					update_slot(footer_slot, footer_slot_template, ctx, /*$$scope*/ ctx[4], dirty, get_footer_slot_changes, get_footer_slot_context);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(footer_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(footer_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    			if (footer_slot) footer_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(18:0) {#if is_footer}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let events_action;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*is_header*/ ctx[1] && create_if_block_1(ctx);
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);
    	let if_block1 = /*is_footer*/ ctx[2] && create_if_block(ctx);
    	let div_levels = [/*$$restProps*/ ctx[3]];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (default_slot) default_slot.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			set_attributes(div, div_data);
    			toggle_class(div, "card", 1);
    			add_location(div, file$1, 10, 0, 326);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			append_dev(div, t1);
    			if (if_block1) if_block1.m(div, null);
    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(events_action = /*events*/ ctx[0].call(null, div));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*is_header*/ ctx[1]) if_block0.p(ctx, dirty);

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 16) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
    				}
    			}

    			if (/*is_footer*/ ctx[2]) if_block1.p(ctx, dirty);
    			set_attributes(div, div_data = get_spread_update(div_levels, [dirty & /*$$restProps*/ 8 && /*$$restProps*/ ctx[3]]));
    			toggle_class(div, "card", 1);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(default_slot, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(default_slot, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (default_slot) default_slot.d(detaching);
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const omit_props_names = [];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Card", slots, ['header','default','footer']);
    	const events = getEventsAction(current_component);
    	let is_header = $$props.$$slots && $$props.$$slots.header !== undefined;
    	let is_footer = $$props.$$slots && $$props.$$slots.footer !== undefined;

    	$$self.$$set = $$new_props => {
    		$$invalidate(6, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		$$invalidate(3, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("$$scope" in $$new_props) $$invalidate(4, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getEventsAction,
    		current_component,
    		events,
    		is_header,
    		is_footer
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(6, $$props = assign(assign({}, $$props), $$new_props));
    		if ("is_header" in $$props) $$invalidate(1, is_header = $$new_props.is_header);
    		if ("is_footer" in $$props) $$invalidate(2, is_footer = $$new_props.is_footer);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [events, is_header, is_footer, $$restProps, $$scope, slots];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* node_modules\svelte-chota\cmp\Icon.svelte generated by Svelte v3.28.0 */
    const file$2 = "node_modules\\svelte-chota\\cmp\\Icon.svelte";

    // (80:0) {:else}
    function create_else_block(ctx) {
    	let svg;
    	let events_action;
    	let mounted;
    	let dispose;

    	function select_block_type_1(ctx, dirty) {
    		if (/*spin*/ ctx[0] !== false) return create_if_block_2;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);
    	let svg_levels = [{ viewBox: "0 0 24 24" }, { style: /*style*/ ctx[6] }, /*$$restProps*/ ctx[9]];
    	let svg_data = {};

    	for (let i = 0; i < svg_levels.length; i += 1) {
    		svg_data = assign(svg_data, svg_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			if_block.c();
    			set_svg_attributes(svg, svg_data);
    			toggle_class(svg, "svelte-1q4wean", true);
    			add_location(svg, file$2, 80, 1, 2115);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			if_block.m(svg, null);

    			if (!mounted) {
    				dispose = action_destroyer(events_action = /*events*/ ctx[8].call(null, svg));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(svg, null);
    				}
    			}

    			set_svg_attributes(svg, svg_data = get_spread_update(svg_levels, [
    				{ viewBox: "0 0 24 24" },
    				dirty & /*style*/ 64 && { style: /*style*/ ctx[6] },
    				dirty & /*$$restProps*/ 512 && /*$$restProps*/ ctx[9]
    			]));

    			toggle_class(svg, "svelte-1q4wean", true);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(80:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (76:14) 
    function create_if_block_1$1(ctx) {
    	let svg;
    	let use_1;
    	let events_action;
    	let mounted;
    	let dispose;
    	let svg_levels = [{ viewBox: "0 0 24 24" }, { style: /*style*/ ctx[6] }, /*$$restProps*/ ctx[9]];
    	let svg_data = {};

    	for (let i = 0; i < svg_levels.length; i += 1) {
    		svg_data = assign(svg_data, svg_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			use_1 = svg_element("use");
    			xlink_attr(use_1, "xlink:href", /*use*/ ctx[2]);
    			attr_dev(use_1, "style", /*aniStyle*/ ctx[7]);
    			attr_dev(use_1, "class", "svelte-1q4wean");
    			toggle_class(use_1, "spinCW", /*spinCW*/ ctx[4]);
    			toggle_class(use_1, "spinCCW", /*spinCCW*/ ctx[5]);
    			add_location(use_1, file$2, 77, 2, 2025);
    			set_svg_attributes(svg, svg_data);
    			toggle_class(svg, "svelte-1q4wean", true);
    			add_location(svg, file$2, 76, 1, 1961);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, use_1);

    			if (!mounted) {
    				dispose = action_destroyer(events_action = /*events*/ ctx[8].call(null, svg));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*use*/ 4) {
    				xlink_attr(use_1, "xlink:href", /*use*/ ctx[2]);
    			}

    			if (dirty & /*aniStyle*/ 128) {
    				attr_dev(use_1, "style", /*aniStyle*/ ctx[7]);
    			}

    			if (dirty & /*spinCW*/ 16) {
    				toggle_class(use_1, "spinCW", /*spinCW*/ ctx[4]);
    			}

    			if (dirty & /*spinCCW*/ 32) {
    				toggle_class(use_1, "spinCCW", /*spinCCW*/ ctx[5]);
    			}

    			set_svg_attributes(svg, svg_data = get_spread_update(svg_levels, [
    				{ viewBox: "0 0 24 24" },
    				dirty & /*style*/ 64 && { style: /*style*/ ctx[6] },
    				dirty & /*$$restProps*/ 512 && /*$$restProps*/ ctx[9]
    			]));

    			toggle_class(svg, "svelte-1q4wean", true);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(76:14) ",
    		ctx
    	});

    	return block;
    }

    // (72:0) {#if url}
    function create_if_block$1(ctx) {
    	let span;
    	let img;
    	let img_src_value;
    	let events_action;
    	let mounted;
    	let dispose;
    	let span_levels = [{ style: /*style*/ ctx[6] }, /*$$restProps*/ ctx[9]];
    	let span_data = {};

    	for (let i = 0; i < span_levels.length; i += 1) {
    		span_data = assign(span_data, span_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			span = element("span");
    			img = element("img");
    			if (img.src !== (img_src_value = /*url*/ ctx[3])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "width", "100%");
    			attr_dev(img, "height", "100%");
    			attr_dev(img, "style", /*aniStyle*/ ctx[7]);
    			attr_dev(img, "class", "svelte-1q4wean");
    			toggle_class(img, "spinCW", /*spinCW*/ ctx[4]);
    			toggle_class(img, "spinCCW", /*spinCCW*/ ctx[5]);
    			add_location(img, file$2, 73, 2, 1838);
    			set_attributes(span, span_data);
    			toggle_class(span, "svelte-1q4wean", true);
    			add_location(span, file$2, 72, 1, 1793);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, img);

    			if (!mounted) {
    				dispose = action_destroyer(events_action = /*events*/ ctx[8].call(null, span));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*url*/ 8 && img.src !== (img_src_value = /*url*/ ctx[3])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*aniStyle*/ 128) {
    				attr_dev(img, "style", /*aniStyle*/ ctx[7]);
    			}

    			if (dirty & /*spinCW*/ 16) {
    				toggle_class(img, "spinCW", /*spinCW*/ ctx[4]);
    			}

    			if (dirty & /*spinCCW*/ 32) {
    				toggle_class(img, "spinCCW", /*spinCCW*/ ctx[5]);
    			}

    			set_attributes(span, span_data = get_spread_update(span_levels, [
    				dirty & /*style*/ 64 && { style: /*style*/ ctx[6] },
    				dirty & /*$$restProps*/ 512 && /*$$restProps*/ ctx[9]
    			]));

    			toggle_class(span, "svelte-1q4wean", true);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(72:0) {#if url}",
    		ctx
    	});

    	return block;
    }

    // (86:1) {:else}
    function create_else_block_1(ctx) {
    	let path_1;

    	const block = {
    		c: function create() {
    			path_1 = svg_element("path");
    			attr_dev(path_1, "d", /*path*/ ctx[1]);
    			add_location(path_1, file$2, 86, 2, 2293);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path_1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*path*/ 2) {
    				attr_dev(path_1, "d", /*path*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(86:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (82:1) {#if spin !== false}
    function create_if_block_2(ctx) {
    	let g;
    	let path_1;

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			path_1 = svg_element("path");
    			attr_dev(path_1, "d", /*path*/ ctx[1]);
    			add_location(path_1, file$2, 83, 3, 2252);
    			attr_dev(g, "style", /*aniStyle*/ ctx[7]);
    			attr_dev(g, "class", "svelte-1q4wean");
    			toggle_class(g, "spinCW", /*spinCW*/ ctx[4]);
    			toggle_class(g, "spinCCW", /*spinCCW*/ ctx[5]);
    			add_location(g, file$2, 82, 2, 2201);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			append_dev(g, path_1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*path*/ 2) {
    				attr_dev(path_1, "d", /*path*/ ctx[1]);
    			}

    			if (dirty & /*aniStyle*/ 128) {
    				attr_dev(g, "style", /*aniStyle*/ ctx[7]);
    			}

    			if (dirty & /*spinCW*/ 16) {
    				toggle_class(g, "spinCW", /*spinCW*/ ctx[4]);
    			}

    			if (dirty & /*spinCCW*/ 32) {
    				toggle_class(g, "spinCCW", /*spinCCW*/ ctx[5]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(82:1) {#if spin !== false}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*url*/ ctx[3]) return create_if_block$1;
    		if (/*use*/ ctx[2]) return create_if_block_1$1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	const omit_props_names = ["src","size","color","flipH","flipV","rotate","spin"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Icon", slots, []);
    	const events = getEventsAction(current_component);
    	let { src = null } = $$props;
    	let { size = 1 } = $$props;
    	let { color = null } = $$props;
    	let { flipH = null } = $$props;
    	let { flipV = null } = $$props;
    	let { rotate = 0 } = $$props;
    	let { spin = false } = $$props;
    	let path = false;
    	let use = false;
    	let url = false;

    	// size
    	if (Number(size)) size = Number(size);

    	// styles
    	const getStyles = () => {
    		const transform = [];
    		const styles = [];

    		if (size !== null) {
    			const width = typeof size === "string" ? size : `${size * 1.5}rem`;
    			styles.push(["width", width]);
    			styles.push(["height", width]);
    		}

    		styles.push(["fill", color !== null ? color : "currentColor"]);

    		if (flipH) {
    			transform.push("scaleX(-1)");
    		}

    		if (flipV) {
    			transform.push("scaleY(-1)");
    		}

    		if (rotate != 0) {
    			transform.push(`rotate(${rotate}deg)`);
    		}

    		if (transform.length > 0) {
    			styles.push(["transform", transform.join(" ")]);
    			styles.push(["transform-origin", "center"]);
    		}

    		return styles.reduce(
    			(cur, item) => {
    				return `${cur} ${item[0]}:${item[1]};`;
    			},
    			""
    		);
    	};

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(9, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("src" in $$new_props) $$invalidate(11, src = $$new_props.src);
    		if ("size" in $$new_props) $$invalidate(10, size = $$new_props.size);
    		if ("color" in $$new_props) $$invalidate(12, color = $$new_props.color);
    		if ("flipH" in $$new_props) $$invalidate(13, flipH = $$new_props.flipH);
    		if ("flipV" in $$new_props) $$invalidate(14, flipV = $$new_props.flipV);
    		if ("rotate" in $$new_props) $$invalidate(15, rotate = $$new_props.rotate);
    		if ("spin" in $$new_props) $$invalidate(0, spin = $$new_props.spin);
    	};

    	$$self.$capture_state = () => ({
    		getEventsAction,
    		current_component,
    		events,
    		src,
    		size,
    		color,
    		flipH,
    		flipV,
    		rotate,
    		spin,
    		path,
    		use,
    		url,
    		getStyles,
    		inverse,
    		spintime,
    		spinCW,
    		spinCCW,
    		style,
    		aniStyle
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("src" in $$props) $$invalidate(11, src = $$new_props.src);
    		if ("size" in $$props) $$invalidate(10, size = $$new_props.size);
    		if ("color" in $$props) $$invalidate(12, color = $$new_props.color);
    		if ("flipH" in $$props) $$invalidate(13, flipH = $$new_props.flipH);
    		if ("flipV" in $$props) $$invalidate(14, flipV = $$new_props.flipV);
    		if ("rotate" in $$props) $$invalidate(15, rotate = $$new_props.rotate);
    		if ("spin" in $$props) $$invalidate(0, spin = $$new_props.spin);
    		if ("path" in $$props) $$invalidate(1, path = $$new_props.path);
    		if ("use" in $$props) $$invalidate(2, use = $$new_props.use);
    		if ("url" in $$props) $$invalidate(3, url = $$new_props.url);
    		if ("inverse" in $$props) $$invalidate(16, inverse = $$new_props.inverse);
    		if ("spintime" in $$props) $$invalidate(17, spintime = $$new_props.spintime);
    		if ("spinCW" in $$props) $$invalidate(4, spinCW = $$new_props.spinCW);
    		if ("spinCCW" in $$props) $$invalidate(5, spinCCW = $$new_props.spinCCW);
    		if ("style" in $$props) $$invalidate(6, style = $$new_props.style);
    		if ("aniStyle" in $$props) $$invalidate(7, aniStyle = $$new_props.aniStyle);
    	};

    	let inverse;
    	let spintime;
    	let spinCW;
    	let spinCCW;
    	let style;
    	let aniStyle;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*src*/ 2048) {
    			//Icon source
    			 if (!!src && src.toLowerCase().trim().endsWith(".svg")) {
    				$$invalidate(3, url = src);
    				$$invalidate(1, path = $$invalidate(2, use = false));
    			} else if (!!src && src.toLowerCase().trim().includes(".svg#")) {
    				$$invalidate(2, use = src);
    				$$invalidate(3, url = $$invalidate(1, path = false));
    			} else if (!!src) {
    				$$invalidate(1, path = src);
    				$$invalidate(3, url = $$invalidate(2, use = false));
    			}
    		}

    		if ($$self.$$.dirty & /*spin*/ 1) {
    			// SPIN properties
    			 $$invalidate(16, inverse = typeof spin !== "boolean" && spin < 0 ? true : false);
    		}

    		if ($$self.$$.dirty & /*spin*/ 1) {
    			 $$invalidate(17, spintime = Math.abs(spin === true ? 2 : spin));
    		}

    		if ($$self.$$.dirty & /*spin, inverse*/ 65537) {
    			 $$invalidate(4, spinCW = !!spin && !inverse);
    		}

    		if ($$self.$$.dirty & /*spin, inverse*/ 65537) {
    			 $$invalidate(5, spinCCW = !!spin && inverse);
    		}

    		if ($$self.$$.dirty & /*size, color, flipH, flipV, rotate*/ 62464) {
    			 $$invalidate(6, style = getStyles());
    		}

    		if ($$self.$$.dirty & /*spin, spintime*/ 131073) {
    			 $$invalidate(7, aniStyle = !!spin ? `animation-duration: ${spintime}s` : undefined);
    		}
    	};

    	return [
    		spin,
    		path,
    		use,
    		url,
    		spinCW,
    		spinCCW,
    		style,
    		aniStyle,
    		events,
    		$$restProps,
    		size,
    		src,
    		color,
    		flipH,
    		flipV,
    		rotate
    	];
    }

    class Icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			src: 11,
    			size: 10,
    			color: 12,
    			flipH: 13,
    			flipV: 14,
    			rotate: 15,
    			spin: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Icon",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get src() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set src(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get flipH() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set flipH(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get flipV() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set flipV(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rotate() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rotate(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get spin() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set spin(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-chota\cmp\Button.svelte generated by Svelte v3.28.0 */
    const file$3 = "node_modules\\svelte-chota\\cmp\\Button.svelte";

    // (87:0) {:else}
    function create_else_block$1(ctx) {
    	let details;
    	let summary;
    	let t0;

    	let t1_value = (/*dropdown*/ ctx[11] !== true
    	? /*dropdown*/ ctx[11]
    	: "") + "";

    	let t1;
    	let t2;
    	let events_action;
    	let t3;
    	let card;
    	let dropdownAction_action;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*icon*/ ctx[9] && create_if_block_4(ctx);
    	let if_block1 = /*iconRight*/ ctx[10] && create_if_block_3(ctx);
    	let summary_levels = [/*$$restProps*/ ctx[17]];
    	let summary_data = {};

    	for (let i = 0; i < summary_levels.length; i += 1) {
    		summary_data = assign(summary_data, summary_levels[i]);
    	}

    	card = new Card({
    			props: {
    				style: "z-index:1",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			details = element("details");
    			summary = element("summary");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			create_component(card.$$.fragment);
    			set_attributes(summary, summary_data);
    			toggle_class(summary, "button", 1);
    			toggle_class(summary, "outline", /*outline*/ ctx[1]);
    			toggle_class(summary, "primary", /*primary*/ ctx[2]);
    			toggle_class(summary, "secondary", /*secondary*/ ctx[3]);
    			toggle_class(summary, "dark", /*dark*/ ctx[4]);
    			toggle_class(summary, "error", /*error*/ ctx[5]);
    			toggle_class(summary, "success", /*success*/ ctx[6]);
    			toggle_class(summary, "clear", /*clear*/ ctx[7]);
    			toggle_class(summary, "loading", /*loading*/ ctx[8]);
    			toggle_class(summary, "icon", /*clIcon*/ ctx[14]);
    			toggle_class(summary, "icon-only", /*clIcononly*/ ctx[15]);
    			toggle_class(summary, "svelte-1o5ccdl", true);
    			add_location(summary, file$3, 88, 4, 2367);
    			attr_dev(details, "class", "dropdown");
    			add_location(details, file$3, 87, 2, 2295);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, details, anchor);
    			append_dev(details, summary);
    			if (if_block0) if_block0.m(summary, null);
    			append_dev(summary, t0);
    			append_dev(summary, t1);
    			append_dev(summary, t2);
    			if (if_block1) if_block1.m(summary, null);
    			append_dev(details, t3);
    			mount_component(card, details, null);
    			details.open = /*open*/ ctx[0];
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(events_action = /*events*/ ctx[16].call(null, summary)),
    					listen_dev(details, "toggle", /*details_toggle_handler*/ ctx[19]),
    					action_destroyer(dropdownAction_action = dropdownAction.call(null, details, /*autoclose*/ ctx[12]))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*icon*/ ctx[9]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*icon*/ 512) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(summary, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if ((!current || dirty & /*dropdown*/ 2048) && t1_value !== (t1_value = (/*dropdown*/ ctx[11] !== true
    			? /*dropdown*/ ctx[11]
    			: "") + "")) set_data_dev(t1, t1_value);

    			if (/*iconRight*/ ctx[10]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*iconRight*/ 1024) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_3(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(summary, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			set_attributes(summary, summary_data = get_spread_update(summary_levels, [dirty & /*$$restProps*/ 131072 && /*$$restProps*/ ctx[17]]));
    			toggle_class(summary, "button", 1);
    			toggle_class(summary, "outline", /*outline*/ ctx[1]);
    			toggle_class(summary, "primary", /*primary*/ ctx[2]);
    			toggle_class(summary, "secondary", /*secondary*/ ctx[3]);
    			toggle_class(summary, "dark", /*dark*/ ctx[4]);
    			toggle_class(summary, "error", /*error*/ ctx[5]);
    			toggle_class(summary, "success", /*success*/ ctx[6]);
    			toggle_class(summary, "clear", /*clear*/ ctx[7]);
    			toggle_class(summary, "loading", /*loading*/ ctx[8]);
    			toggle_class(summary, "icon", /*clIcon*/ ctx[14]);
    			toggle_class(summary, "icon-only", /*clIcononly*/ ctx[15]);
    			toggle_class(summary, "svelte-1o5ccdl", true);
    			const card_changes = {};

    			if (dirty & /*$$scope*/ 1048576) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);

    			if (dirty & /*open*/ 1) {
    				details.open = /*open*/ ctx[0];
    			}

    			if (dropdownAction_action && is_function(dropdownAction_action.update) && dirty & /*autoclose*/ 4096) dropdownAction_action.update.call(null, /*autoclose*/ ctx[12]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(details);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_component(card);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(87:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (64:0) {#if dropdown === false}
    function create_if_block$2(ctx) {
    	let button;
    	let t0;
    	let t1;
    	let button_type_value;
    	let events_action;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*icon*/ ctx[9] && create_if_block_2$1(ctx);
    	const default_slot_template = /*#slots*/ ctx[18].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[20], null);
    	let if_block1 = /*iconRight*/ ctx[10] && create_if_block_1$2(ctx);

    	let button_levels = [
    		/*$$restProps*/ ctx[17],
    		{
    			type: button_type_value = /*submit*/ ctx[13] ? "submit" : null
    		}
    	];

    	let button_data = {};

    	for (let i = 0; i < button_levels.length; i += 1) {
    		button_data = assign(button_data, button_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (default_slot) default_slot.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			set_attributes(button, button_data);
    			toggle_class(button, "button", 1);
    			toggle_class(button, "outline", /*outline*/ ctx[1]);
    			toggle_class(button, "primary", /*primary*/ ctx[2]);
    			toggle_class(button, "secondary", /*secondary*/ ctx[3]);
    			toggle_class(button, "dark", /*dark*/ ctx[4]);
    			toggle_class(button, "error", /*error*/ ctx[5]);
    			toggle_class(button, "success", /*success*/ ctx[6]);
    			toggle_class(button, "clear", /*clear*/ ctx[7]);
    			toggle_class(button, "loading", /*loading*/ ctx[8]);
    			toggle_class(button, "icon", /*clIcon*/ ctx[14]);
    			toggle_class(button, "icon-only", /*clIcononly*/ ctx[15]);
    			toggle_class(button, "svelte-1o5ccdl", true);
    			add_location(button, file$3, 64, 0, 1789);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			if (if_block0) if_block0.m(button, null);
    			append_dev(button, t0);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			append_dev(button, t1);
    			if (if_block1) if_block1.m(button, null);
    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(events_action = /*events*/ ctx[16].call(null, button));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*icon*/ ctx[9]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*icon*/ 512) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2$1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(button, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1048576) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[20], dirty, null, null);
    				}
    			}

    			if (/*iconRight*/ ctx[10]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*iconRight*/ 1024) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1$2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(button, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			set_attributes(button, button_data = get_spread_update(button_levels, [
    				dirty & /*$$restProps*/ 131072 && /*$$restProps*/ ctx[17],
    				(!current || dirty & /*submit*/ 8192 && button_type_value !== (button_type_value = /*submit*/ ctx[13] ? "submit" : null)) && { type: button_type_value }
    			]));

    			toggle_class(button, "button", 1);
    			toggle_class(button, "outline", /*outline*/ ctx[1]);
    			toggle_class(button, "primary", /*primary*/ ctx[2]);
    			toggle_class(button, "secondary", /*secondary*/ ctx[3]);
    			toggle_class(button, "dark", /*dark*/ ctx[4]);
    			toggle_class(button, "error", /*error*/ ctx[5]);
    			toggle_class(button, "success", /*success*/ ctx[6]);
    			toggle_class(button, "clear", /*clear*/ ctx[7]);
    			toggle_class(button, "loading", /*loading*/ ctx[8]);
    			toggle_class(button, "icon", /*clIcon*/ ctx[14]);
    			toggle_class(button, "icon-only", /*clIcononly*/ ctx[15]);
    			toggle_class(button, "svelte-1o5ccdl", true);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(default_slot, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(default_slot, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (if_block0) if_block0.d();
    			if (default_slot) default_slot.d(detaching);
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(64:0) {#if dropdown === false}",
    		ctx
    	});

    	return block;
    }

    // (106:4) {#if icon}
    function create_if_block_4(ctx) {
    	let span;
    	let icon_1;
    	let current;

    	icon_1 = new Icon({
    			props: { src: /*icon*/ ctx[9], size: "24px" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			span = element("span");
    			create_component(icon_1.$$.fragment);
    			attr_dev(span, "class", "lefticon svelte-1o5ccdl");
    			add_location(span, file$3, 105, 15, 2712);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			mount_component(icon_1, span, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_1_changes = {};
    			if (dirty & /*icon*/ 512) icon_1_changes.src = /*icon*/ ctx[9];
    			icon_1.$set(icon_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			destroy_component(icon_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(106:4) {#if icon}",
    		ctx
    	});

    	return block;
    }

    // (108:4) {#if iconRight}
    function create_if_block_3(ctx) {
    	let span;
    	let icon_1;
    	let current;

    	icon_1 = new Icon({
    			props: { src: /*iconRight*/ ctx[10], size: "24px" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			span = element("span");
    			create_component(icon_1.$$.fragment);
    			attr_dev(span, "class", "righticon svelte-1o5ccdl");
    			add_location(span, file$3, 107, 20, 2844);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			mount_component(icon_1, span, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_1_changes = {};
    			if (dirty & /*iconRight*/ 1024) icon_1_changes.src = /*iconRight*/ ctx[10];
    			icon_1.$set(icon_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			destroy_component(icon_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(108:4) {#if iconRight}",
    		ctx
    	});

    	return block;
    }

    // (110:4) <Card style="z-index:1">
    function create_default_slot(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[18].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[20], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1048576) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[20], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(110:4) <Card style=\\\"z-index:1\\\">",
    		ctx
    	});

    	return block;
    }

    // (83:0) {#if icon}
    function create_if_block_2$1(ctx) {
    	let span;
    	let icon_1;
    	let current;

    	icon_1 = new Icon({
    			props: { src: /*icon*/ ctx[9], size: "24px" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			span = element("span");
    			create_component(icon_1.$$.fragment);
    			attr_dev(span, "class", "lefticon svelte-1o5ccdl");
    			add_location(span, file$3, 82, 11, 2103);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			mount_component(icon_1, span, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_1_changes = {};
    			if (dirty & /*icon*/ 512) icon_1_changes.src = /*icon*/ ctx[9];
    			icon_1.$set(icon_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			destroy_component(icon_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(83:0) {#if icon}",
    		ctx
    	});

    	return block;
    }

    // (85:0) {#if iconRight}
    function create_if_block_1$2(ctx) {
    	let span;
    	let icon_1;
    	let current;

    	icon_1 = new Icon({
    			props: { src: /*iconRight*/ ctx[10], size: "24px" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			span = element("span");
    			create_component(icon_1.$$.fragment);
    			attr_dev(span, "class", "righticon svelte-1o5ccdl");
    			add_location(span, file$3, 84, 16, 2201);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			mount_component(icon_1, span, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_1_changes = {};
    			if (dirty & /*iconRight*/ 1024) icon_1_changes.src = /*iconRight*/ ctx[10];
    			icon_1.$set(icon_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			destroy_component(icon_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(85:0) {#if iconRight}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*dropdown*/ ctx[11] === false) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function dropdownAction(node, param) {
    	let autoclose = param;
    	let button = node.getElementsByTagName("summary")[0];

    	const clickOutside = () => {
    		if (!!node.open) node.open = false;
    	};

    	const clickButton = e => {
    		e.stopPropagation();
    	};

    	const clickInDD = e => {
    		e.stopPropagation();
    		if (autoclose) node.open = false;
    	};

    	node.addEventListener("click", clickInDD);
    	button.addEventListener("click", clickButton);
    	window.addEventListener("click", clickOutside);

    	return {
    		update: param => autoclose = param,
    		destroy: () => {
    			window.removeEventListener("click", clickOutside);
    			node.removeEventListener("click", clickInDD);
    			button.removeEventListener("click", clickButton);
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	const omit_props_names = [
    		"outline","primary","secondary","dark","error","success","clear","loading","icon","iconRight","dropdown","open","autoclose","submit"
    	];

    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button", slots, ['default']);
    	let { outline = null } = $$props;
    	let { primary = null } = $$props;
    	let { secondary = null } = $$props;
    	let { dark = null } = $$props;
    	let { error = null } = $$props;
    	let { success = null } = $$props;
    	let { clear = null } = $$props;
    	let { loading = null } = $$props;
    	let { icon = null } = $$props;
    	let { iconRight = null } = $$props;
    	let { dropdown = false } = $$props;
    	let { open = false } = $$props;
    	let { autoclose = false } = $$props;
    	let { submit = false } = $$props;
    	const events = getEventsAction(current_component);
    	const hasSlot = $$props.$$slots && $$props.$$slots !== undefined;

    	function details_toggle_handler() {
    		open = this.open;
    		$$invalidate(0, open);
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(22, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		$$invalidate(17, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("outline" in $$new_props) $$invalidate(1, outline = $$new_props.outline);
    		if ("primary" in $$new_props) $$invalidate(2, primary = $$new_props.primary);
    		if ("secondary" in $$new_props) $$invalidate(3, secondary = $$new_props.secondary);
    		if ("dark" in $$new_props) $$invalidate(4, dark = $$new_props.dark);
    		if ("error" in $$new_props) $$invalidate(5, error = $$new_props.error);
    		if ("success" in $$new_props) $$invalidate(6, success = $$new_props.success);
    		if ("clear" in $$new_props) $$invalidate(7, clear = $$new_props.clear);
    		if ("loading" in $$new_props) $$invalidate(8, loading = $$new_props.loading);
    		if ("icon" in $$new_props) $$invalidate(9, icon = $$new_props.icon);
    		if ("iconRight" in $$new_props) $$invalidate(10, iconRight = $$new_props.iconRight);
    		if ("dropdown" in $$new_props) $$invalidate(11, dropdown = $$new_props.dropdown);
    		if ("open" in $$new_props) $$invalidate(0, open = $$new_props.open);
    		if ("autoclose" in $$new_props) $$invalidate(12, autoclose = $$new_props.autoclose);
    		if ("submit" in $$new_props) $$invalidate(13, submit = $$new_props.submit);
    		if ("$$scope" in $$new_props) $$invalidate(20, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getEventsAction,
    		current_component,
    		Card,
    		Icon,
    		outline,
    		primary,
    		secondary,
    		dark,
    		error,
    		success,
    		clear,
    		loading,
    		icon,
    		iconRight,
    		dropdown,
    		open,
    		autoclose,
    		submit,
    		events,
    		hasSlot,
    		dropdownAction,
    		clIcon,
    		clIcononly
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(22, $$props = assign(assign({}, $$props), $$new_props));
    		if ("outline" in $$props) $$invalidate(1, outline = $$new_props.outline);
    		if ("primary" in $$props) $$invalidate(2, primary = $$new_props.primary);
    		if ("secondary" in $$props) $$invalidate(3, secondary = $$new_props.secondary);
    		if ("dark" in $$props) $$invalidate(4, dark = $$new_props.dark);
    		if ("error" in $$props) $$invalidate(5, error = $$new_props.error);
    		if ("success" in $$props) $$invalidate(6, success = $$new_props.success);
    		if ("clear" in $$props) $$invalidate(7, clear = $$new_props.clear);
    		if ("loading" in $$props) $$invalidate(8, loading = $$new_props.loading);
    		if ("icon" in $$props) $$invalidate(9, icon = $$new_props.icon);
    		if ("iconRight" in $$props) $$invalidate(10, iconRight = $$new_props.iconRight);
    		if ("dropdown" in $$props) $$invalidate(11, dropdown = $$new_props.dropdown);
    		if ("open" in $$props) $$invalidate(0, open = $$new_props.open);
    		if ("autoclose" in $$props) $$invalidate(12, autoclose = $$new_props.autoclose);
    		if ("submit" in $$props) $$invalidate(13, submit = $$new_props.submit);
    		if ("clIcon" in $$props) $$invalidate(14, clIcon = $$new_props.clIcon);
    		if ("clIcononly" in $$props) $$invalidate(15, clIcononly = $$new_props.clIcononly);
    	};

    	let clIcon;
    	let clIcononly;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*icon, iconRight*/ 1536) {
    			 $$invalidate(14, clIcon = (icon !== null || iconRight !== null) && hasSlot);
    		}

    		if ($$self.$$.dirty & /*dropdown, icon*/ 2560) {
    			 $$invalidate(15, clIcononly = dropdown
    			? icon !== null && dropdown === true
    			: icon !== null && !hasSlot);
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		open,
    		outline,
    		primary,
    		secondary,
    		dark,
    		error,
    		success,
    		clear,
    		loading,
    		icon,
    		iconRight,
    		dropdown,
    		autoclose,
    		submit,
    		clIcon,
    		clIcononly,
    		events,
    		$$restProps,
    		slots,
    		details_toggle_handler,
    		$$scope
    	];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			outline: 1,
    			primary: 2,
    			secondary: 3,
    			dark: 4,
    			error: 5,
    			success: 6,
    			clear: 7,
    			loading: 8,
    			icon: 9,
    			iconRight: 10,
    			dropdown: 11,
    			open: 0,
    			autoclose: 12,
    			submit: 13
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get outline() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outline(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get primary() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set primary(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get secondary() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set secondary(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dark() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dark(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get error() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set error(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get success() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set success(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get clear() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set clear(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loading() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loading(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconRight() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconRight(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dropdown() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dropdown(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get open() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set open(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get autoclose() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set autoclose(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get submit() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set submit(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-chota\cmp\Input.svelte generated by Svelte v3.28.0 */
    const file$4 = "node_modules\\svelte-chota\\cmp\\Input.svelte";

    // (61:0) {:else}
    function create_else_block$2(ctx) {
    	let input;
    	let events_action;
    	let mounted;
    	let dispose;
    	let input_levels = [{ type: /*type*/ ctx[1] }, /*$$restProps*/ ctx[6], { value: /*value*/ ctx[0] }];
    	let input_data = {};

    	for (let i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			toggle_class(input, "error", /*error*/ ctx[2]);
    			toggle_class(input, "success", /*success*/ ctx[3]);
    			toggle_class(input, "svelte-ovucoa", true);
    			add_location(input, file$4, 61, 1, 1342);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			input.value = input_data.value;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(events_action = /*events*/ ctx[4].call(null, input)),
    					listen_dev(input, "input", /*onInput*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(input, input_data = get_spread_update(input_levels, [
    				dirty & /*type*/ 2 && { type: /*type*/ ctx[1] },
    				dirty & /*$$restProps*/ 64 && /*$$restProps*/ ctx[6],
    				dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0] && { value: /*value*/ ctx[0] }
    			]));

    			if ("value" in input_data) {
    				input.value = input_data.value;
    			}

    			toggle_class(input, "error", /*error*/ ctx[2]);
    			toggle_class(input, "success", /*success*/ ctx[3]);
    			toggle_class(input, "svelte-ovucoa", true);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(61:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (53:0) {#if type === 'textarea'}
    function create_if_block$3(ctx) {
    	let textarea_1;
    	let events_action;
    	let mounted;
    	let dispose;
    	let textarea_1_levels = [/*$$restProps*/ ctx[6], { value: /*value*/ ctx[0] }];
    	let textarea_1_data = {};

    	for (let i = 0; i < textarea_1_levels.length; i += 1) {
    		textarea_1_data = assign(textarea_1_data, textarea_1_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			textarea_1 = element("textarea");
    			set_attributes(textarea_1, textarea_1_data);
    			toggle_class(textarea_1, "error", /*error*/ ctx[2]);
    			toggle_class(textarea_1, "success", /*success*/ ctx[3]);
    			add_location(textarea_1, file$4, 53, 1, 1217);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, textarea_1, anchor);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(events_action = /*events*/ ctx[4].call(null, textarea_1)),
    					listen_dev(textarea_1, "input", /*onInput*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(textarea_1, textarea_1_data = get_spread_update(textarea_1_levels, [
    				dirty & /*$$restProps*/ 64 && /*$$restProps*/ ctx[6],
    				dirty & /*value*/ 1 && { value: /*value*/ ctx[0] }
    			]));

    			toggle_class(textarea_1, "error", /*error*/ ctx[2]);
    			toggle_class(textarea_1, "success", /*success*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(textarea_1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(53:0) {#if type === 'textarea'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*type*/ ctx[1] === "textarea") return create_if_block$3;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	const omit_props_names = [
    		"value","type","error","success","password","number","textarea","color","date","range"
    	];

    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Input", slots, []);
    	let { value = "" } = $$props;
    	let { type = "text" } = $$props;
    	let { error = null } = $$props;
    	let { success = null } = $$props;
    	let { password = false } = $$props;
    	let { number = false } = $$props;
    	let { textarea = false } = $$props;
    	let { color = false } = $$props;
    	let { date = false } = $$props;
    	let { range = false } = $$props;
    	const events = getEventsAction(current_component);

    	const onInput = e => {
    		const type = e.target.type;
    		const val = e.target.value;
    		if (type === "number" || type === "range") $$invalidate(0, value = val === "" ? undefined : +val); else $$invalidate(0, value = val);
    	};

    	let getState = getContext("field:state");
    	let state_unsubscribe = false;

    	if (getState) {
    		state_unsubscribe = getState.subscribe(state => {
    			if (state === "error") $$invalidate(2, error = true); else if (state === "success") $$invalidate(3, success = true); else $$invalidate(3, success = $$invalidate(2, error = false));
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(6, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("value" in $$new_props) $$invalidate(0, value = $$new_props.value);
    		if ("type" in $$new_props) $$invalidate(1, type = $$new_props.type);
    		if ("error" in $$new_props) $$invalidate(2, error = $$new_props.error);
    		if ("success" in $$new_props) $$invalidate(3, success = $$new_props.success);
    		if ("password" in $$new_props) $$invalidate(7, password = $$new_props.password);
    		if ("number" in $$new_props) $$invalidate(8, number = $$new_props.number);
    		if ("textarea" in $$new_props) $$invalidate(9, textarea = $$new_props.textarea);
    		if ("color" in $$new_props) $$invalidate(10, color = $$new_props.color);
    		if ("date" in $$new_props) $$invalidate(11, date = $$new_props.date);
    		if ("range" in $$new_props) $$invalidate(12, range = $$new_props.range);
    	};

    	$$self.$capture_state = () => ({
    		getEventsAction,
    		getContext,
    		current_component,
    		value,
    		type,
    		error,
    		success,
    		password,
    		number,
    		textarea,
    		color,
    		date,
    		range,
    		events,
    		onInput,
    		getState,
    		state_unsubscribe
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("value" in $$props) $$invalidate(0, value = $$new_props.value);
    		if ("type" in $$props) $$invalidate(1, type = $$new_props.type);
    		if ("error" in $$props) $$invalidate(2, error = $$new_props.error);
    		if ("success" in $$props) $$invalidate(3, success = $$new_props.success);
    		if ("password" in $$props) $$invalidate(7, password = $$new_props.password);
    		if ("number" in $$props) $$invalidate(8, number = $$new_props.number);
    		if ("textarea" in $$props) $$invalidate(9, textarea = $$new_props.textarea);
    		if ("color" in $$props) $$invalidate(10, color = $$new_props.color);
    		if ("date" in $$props) $$invalidate(11, date = $$new_props.date);
    		if ("range" in $$props) $$invalidate(12, range = $$new_props.range);
    		if ("getState" in $$props) getState = $$new_props.getState;
    		if ("state_unsubscribe" in $$props) state_unsubscribe = $$new_props.state_unsubscribe;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*password*/ 128) {
    			 if (password) $$invalidate(1, type = "password");
    		}

    		if ($$self.$$.dirty & /*number*/ 256) {
    			 if (number) $$invalidate(1, type = "number");
    		}

    		if ($$self.$$.dirty & /*textarea*/ 512) {
    			 if (textarea) $$invalidate(1, type = "textarea");
    		}

    		if ($$self.$$.dirty & /*color*/ 1024) {
    			 if (color) $$invalidate(1, type = "color");
    		}

    		if ($$self.$$.dirty & /*date*/ 2048) {
    			 if (date) $$invalidate(1, type = "date");
    		}

    		if ($$self.$$.dirty & /*range*/ 4096) {
    			 if (range) $$invalidate(1, type = "range");
    		}
    	};

    	return [
    		value,
    		type,
    		error,
    		success,
    		events,
    		onInput,
    		$$restProps,
    		password,
    		number,
    		textarea,
    		color,
    		date,
    		range
    	];
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			value: 0,
    			type: 1,
    			error: 2,
    			success: 3,
    			password: 7,
    			number: 8,
    			textarea: 9,
    			color: 10,
    			date: 11,
    			range: 12
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get value() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get error() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set error(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get success() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set success(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get password() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set password(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get number() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set number(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get textarea() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set textarea(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get date() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set date(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get range() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set range(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\QRJS.svelte generated by Svelte v3.28.0 */
    const file$5 = "src\\QRJS.svelte";

    function create_fragment$5(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "id", "qrcode");
    			attr_dev(div, "class", "is-center");
    			add_location(div, file$5, 30, 0, 632);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("QRJS", slots, []);
    	let { codeValue } = $$props;
    	let { squareSize } = $$props;
    	let qrcode;

    	onMount(() => {
    		let script = document.createElement("script");
    		script.src = "../js/qrcode.min.js";
    		document.head.append(script);

    		script.onload = function () {
    			qrcode = new QRCode("qrcode",
    			{
    					text: codeValue,
    					width: squareSize,
    					height: squareSize,
    					colorDark: "#000000",
    					colorLight: "#ffffff",
    					correctLevel: QRCode.CorrectLevel.M
    				});
    		};
    	});

    	const writable_props = ["codeValue", "squareSize"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<QRJS> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("codeValue" in $$props) $$invalidate(0, codeValue = $$props.codeValue);
    		if ("squareSize" in $$props) $$invalidate(1, squareSize = $$props.squareSize);
    	};

    	$$self.$capture_state = () => ({ onMount, codeValue, squareSize, qrcode });

    	$$self.$inject_state = $$props => {
    		if ("codeValue" in $$props) $$invalidate(0, codeValue = $$props.codeValue);
    		if ("squareSize" in $$props) $$invalidate(1, squareSize = $$props.squareSize);
    		if ("qrcode" in $$props) qrcode = $$props.qrcode;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [codeValue, squareSize];
    }

    class QRJS extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { codeValue: 0, squareSize: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "QRJS",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*codeValue*/ ctx[0] === undefined && !("codeValue" in props)) {
    			console.warn("<QRJS> was created without expected prop 'codeValue'");
    		}

    		if (/*squareSize*/ ctx[1] === undefined && !("squareSize" in props)) {
    			console.warn("<QRJS> was created without expected prop 'squareSize'");
    		}
    	}

    	get codeValue() {
    		throw new Error("<QRJS>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set codeValue(value) {
    		throw new Error("<QRJS>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get squareSize() {
    		throw new Error("<QRJS>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set squareSize(value) {
    		throw new Error("<QRJS>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.28.0 */

    const { Object: Object_1, console: console_1 } = globals;
    const file$6 = "src\\App.svelte";

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[37] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[37] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[34] = list[i];
    	child_ctx[35] = list;
    	child_ctx[36] = i;
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[31] = list[i];
    	return child_ctx;
    }

    // (171:0) {:else}
    function create_else_block$3(ctx) {
    	let h3;
    	let t1;
    	let p;
    	let t3;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1$3, create_else_block_2];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (prom.type == "flat") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1();
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = `${prom.name}`;
    			t1 = space();
    			p = element("p");
    			p.textContent = `${prom.intro}`;
    			t3 = space();
    			if_block.c();
    			if_block_anchor = empty();
    			attr_dev(h3, "class", "text-center");
    			add_location(h3, file$6, 171, 2, 4461);
    			add_location(p, file$6, 172, 2, 4504);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			insert_dev(target, t3, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t3);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(171:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (164:0) {#if json }
    function create_if_block$4(ctx) {
    	let br;
    	let t0;
    	let button0;
    	let t1;
    	let button1;
    	let t2;
    	let pre;
    	let current;

    	button0 = new Button({
    			props: {
    				primary: true,
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", copy);

    	button1 = new Button({
    			props: {
    				secondary: true,
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", download);

    	const block = {
    		c: function create() {
    			br = element("br");
    			t0 = space();
    			create_component(button0.$$.fragment);
    			t1 = space();
    			create_component(button1.$$.fragment);
    			t2 = space();
    			pre = element("pre");
    			pre.textContent = `${JSON.stringify(prom, null, 2)}`;
    			add_location(br, file$6, 164, 2, 4274);
    			add_location(pre, file$6, 167, 2, 4400);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, br, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(button0, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(button1, target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, pre, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button0_changes = {};

    			if (dirty[0] & /*txt_copy*/ 256 | dirty[1] & /*$$scope*/ 2048) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty[0] & /*txt_download*/ 512 | dirty[1] & /*$$scope*/ 2048) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t0);
    			destroy_component(button0, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(button1, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(pre);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(164:0) {#if json }",
    		ctx
    	});

    	return block;
    }

    // (218:2) {:else}
    function create_else_block_2(ctx) {
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let current_block_type_index;
    	let if_block1;
    	let t3;
    	let br2;
    	let t4;
    	let if_block2_anchor;
    	let current;
    	let if_block0 = /*current*/ ctx[4] && create_if_block_8(ctx);
    	const if_block_creators = [create_if_block_7, create_else_block_3];
    	const if_blocks = [];

    	function select_block_type_3(ctx, dirty) {
    		if (/*next*/ ctx[5]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_3(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block2 = /*showQR*/ ctx[1] && create_if_block_6(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			br0 = element("br");
    			t1 = space();
    			br1 = element("br");
    			t2 = space();
    			if_block1.c();
    			t3 = space();
    			br2 = element("br");
    			t4 = space();
    			if (if_block2) if_block2.c();
    			if_block2_anchor = empty();
    			add_location(br0, file$6, 229, 4, 6189);
    			add_location(br1, file$6, 230, 4, 6198);
    			add_location(br2, file$6, 237, 4, 6416);
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t2, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t4, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, if_block2_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*current*/ ctx[4]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_8(ctx);
    					if_block0.c();
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_3(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(t3.parentNode, t3);
    			}

    			if (/*showQR*/ ctx[1]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*showQR*/ 2) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_6(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t2);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t4);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(if_block2_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(218:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (174:2) {#if prom.type == 'flat' }
    function create_if_block_1$3(ctx) {
    	let t0;
    	let br;
    	let t1;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	let each_value = /*sections*/ ctx[14];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const if_block_creators = [create_if_block_2$2, create_else_block_1$1];
    	const if_blocks = [];

    	function select_block_type_2(ctx, dirty) {
    		if (/*showQR*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_2(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			br = element("br");
    			t1 = space();
    			if_block.c();
    			if_block_anchor = empty();
    			add_location(br, file$6, 194, 4, 5179);
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t0, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t1, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*questions, asks, sections*/ 24577) {
    				each_value = /*sections*/ ctx[14];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(t0.parentNode, t0);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_2(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t1);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(174:2) {#if prom.type == 'flat' }",
    		ctx
    	});

    	return block;
    }

    // (219:4) {#if current }
    function create_if_block_8(ctx) {
    	let h5;
    	let t0_value = /*current*/ ctx[4].name + "";
    	let t0;
    	let t1;
    	let each_1_anchor;
    	let each_value_3 = /*current*/ ctx[4].answers;
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			t0 = text(t0_value);
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			add_location(h5, file$6, 219, 6, 5849);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);
    			append_dev(h5, t0);
    			insert_dev(target, t1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*current*/ 16 && t0_value !== (t0_value = /*current*/ ctx[4].name + "")) set_data_dev(t0, t0_value);

    			if (dirty[0] & /*current, asks*/ 17) {
    				each_value_3 = /*current*/ ctx[4].answers;
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h5);
    			if (detaching) detach_dev(t1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(219:4) {#if current }",
    		ctx
    	});

    	return block;
    }

    // (221:6) {#each current.answers as a}
    function create_each_block_3(ctx) {
    	let div1;
    	let input;
    	let input_value_value;
    	let t0;
    	let div0;
    	let label;
    	let t1_value = /*a*/ ctx[37].name + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			input = element("input");
    			t0 = space();
    			div0 = element("div");
    			label = element("label");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "type", "radio");
    			input.__value = input_value_value = /*a*/ ctx[37].code;
    			input.value = input.__value;
    			/*$$binding_groups*/ ctx[21][1].push(input);
    			add_location(input, file$6, 222, 10, 5971);
    			add_location(label, file$6, 224, 12, 6099);
    			attr_dev(div0, "class", "state p-primary block svelte-1rerc65");
    			add_location(div0, file$6, 223, 10, 6051);
    			attr_dev(div1, "class", "pretty p-default p-round block svelte-1rerc65");
    			add_location(div1, file$6, 221, 8, 5916);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, input);
    			input.checked = input.__value === /*asks*/ ctx[0][/*current*/ ctx[4].code];
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, label);
    			append_dev(label, t1);
    			append_dev(div1, t2);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*input_change_handler_1*/ ctx[22]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*current*/ 16 && input_value_value !== (input_value_value = /*a*/ ctx[37].code)) {
    				prop_dev(input, "__value", input_value_value);
    				input.value = input.__value;
    			}

    			if (dirty[0] & /*asks, current*/ 17) {
    				input.checked = input.__value === /*asks*/ ctx[0][/*current*/ ctx[4].code];
    			}

    			if (dirty[0] & /*current*/ 16 && t1_value !== (t1_value = /*a*/ ctx[37].name + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			/*$$binding_groups*/ ctx[21][1].splice(/*$$binding_groups*/ ctx[21][1].indexOf(input), 1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(221:6) {#each current.answers as a}",
    		ctx
    	});

    	return block;
    }

    // (234:4) {:else}
    function create_else_block_3(ctx) {
    	let button;
    	let current;

    	button = new Button({
    			props: {
    				primary: true,
    				class: "is-full-width",
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*submitCAT*/ ctx[17]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty[0] & /*txt_submit*/ 64 | dirty[1] & /*$$scope*/ 2048) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3.name,
    		type: "else",
    		source: "(234:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (232:4) {#if next }
    function create_if_block_7(ctx) {
    	let button;
    	let current;

    	button = new Button({
    			props: {
    				primary: true,
    				class: "is-full-width",
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*goNext*/ ctx[18]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty[0] & /*txt_next*/ 128 | dirty[1] & /*$$scope*/ 2048) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(232:4) {#if next }",
    		ctx
    	});

    	return block;
    }

    // (235:6) <Button primary on:click={submitCAT} class="is-full-width">
    function create_default_slot_6(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*txt_submit*/ ctx[6]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*txt_submit*/ 64) set_data_dev(t, /*txt_submit*/ ctx[6]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(235:6) <Button primary on:click={submitCAT} class=\\\"is-full-width\\\">",
    		ctx
    	});

    	return block;
    }

    // (233:6) <Button primary on:click={goNext} class="is-full-width">
    function create_default_slot_5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*txt_next*/ ctx[7]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*txt_next*/ 128) set_data_dev(t, /*txt_next*/ ctx[7]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(233:6) <Button primary on:click={goNext} class=\\\"is-full-width\\\">",
    		ctx
    	});

    	return block;
    }

    // (239:4) {#if showQR }
    function create_if_block_6(ctx) {
    	let p;
    	let span;
    	let t1;
    	let qrcode;
    	let t2;
    	let div;
    	let small;
    	let t3;
    	let current;

    	qrcode = new QRJS({
    			props: {
    				codeValue: /*pro*/ ctx[2],
    				squareSize: "250"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			p = element("p");
    			span = element("span");
    			span.textContent = `${prom.name}`;
    			t1 = space();
    			create_component(qrcode.$$.fragment);
    			t2 = space();
    			div = element("div");
    			small = element("small");
    			t3 = text(/*txt_to_scan*/ ctx[11]);
    			add_location(span, file$6, 240, 8, 6477);
    			attr_dev(p, "class", "text-center");
    			add_location(p, file$6, 239, 6, 6445);
    			add_location(small, file$6, 245, 8, 6623);
    			attr_dev(div, "class", "text-grey text-center block svelte-1rerc65");
    			add_location(div, file$6, 244, 6, 6573);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, span);
    			insert_dev(target, t1, anchor);
    			mount_component(qrcode, target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, small);
    			append_dev(small, t3);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const qrcode_changes = {};
    			if (dirty[0] & /*pro*/ 4) qrcode_changes.codeValue = /*pro*/ ctx[2];
    			qrcode.$set(qrcode_changes);
    			if (!current || dirty[0] & /*txt_to_scan*/ 2048) set_data_dev(t3, /*txt_to_scan*/ ctx[11]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(qrcode.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(qrcode.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t1);
    			destroy_component(qrcode, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(239:4) {#if showQR }",
    		ctx
    	});

    	return block;
    }

    // (177:6) {#if s.intro }
    function create_if_block_5(ctx) {
    	let div1;
    	let div0;
    	let t_value = /*s*/ ctx[31].intro + "";
    	let t;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t = text(t_value);
    			attr_dev(div0, "class", "intro svelte-1rerc65");
    			add_location(div0, file$6, 177, 40, 4641);
    			attr_dev(div1, "class", "bg-dark text-white");
    			add_location(div1, file$6, 177, 8, 4609);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(177:6) {#if s.intro }",
    		ctx
    	});

    	return block;
    }

    // (181:8) {#if q.code.substr(0,2) == s.code }
    function create_if_block_4$1(ctx) {
    	let h5;
    	let t0_value = /*q*/ ctx[34].name + "";
    	let t0;
    	let t1;
    	let t2;
    	let hr;
    	let each_value_2 = /*q*/ ctx[34].answers;
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			t0 = text(t0_value);
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			hr = element("hr");
    			add_location(h5, file$6, 181, 10, 4785);
    			add_location(hr, file$6, 190, 10, 5129);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);
    			append_dev(h5, t0);
    			insert_dev(target, t1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t2, anchor);
    			insert_dev(target, hr, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*questions, asks*/ 8193) {
    				each_value_2 = /*q*/ ctx[34].answers;
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(t2.parentNode, t2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h5);
    			if (detaching) detach_dev(t1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(hr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(181:8) {#if q.code.substr(0,2) == s.code }",
    		ctx
    	});

    	return block;
    }

    // (183:10) {#each q.answers as a}
    function create_each_block_2(ctx) {
    	let div1;
    	let input;
    	let input_value_value;
    	let t0;
    	let div0;
    	let label;
    	let t1_value = /*a*/ ctx[37].name + "";
    	let t1;
    	let mounted;
    	let dispose;
    	/*$$binding_groups*/ ctx[21][0][/*q_index*/ ctx[36]] = [];

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[20].call(input, /*q*/ ctx[34]);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			input = element("input");
    			t0 = space();
    			div0 = element("div");
    			label = element("label");
    			t1 = text(t1_value);
    			attr_dev(input, "type", "radio");
    			input.__value = input_value_value = /*a*/ ctx[37].code;
    			input.value = input.__value;
    			/*$$binding_groups*/ ctx[21][0][/*q_index*/ ctx[36]].push(input);
    			add_location(input, file$6, 184, 14, 4907);
    			add_location(label, file$6, 186, 16, 5037);
    			attr_dev(div0, "class", "state p-primary block svelte-1rerc65");
    			add_location(div0, file$6, 185, 14, 4985);
    			attr_dev(div1, "class", "pretty p-default p-round block svelte-1rerc65");
    			add_location(div1, file$6, 183, 12, 4848);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, input);
    			input.checked = input.__value === /*asks*/ ctx[0][/*q*/ ctx[34].code];
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, label);
    			append_dev(label, t1);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", input_change_handler);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*asks, questions*/ 8193) {
    				input.checked = input.__value === /*asks*/ ctx[0][/*q*/ ctx[34].code];
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			/*$$binding_groups*/ ctx[21][0][/*q_index*/ ctx[36]].splice(/*$$binding_groups*/ ctx[21][0][/*q_index*/ ctx[36]].indexOf(input), 1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(183:10) {#each q.answers as a}",
    		ctx
    	});

    	return block;
    }

    // (180:6) {#each questions as q}
    function create_each_block_1(ctx) {
    	let show_if = /*q*/ ctx[34].code.substr(0, 2) == /*s*/ ctx[31].code;
    	let if_block_anchor;
    	let if_block = show_if && create_if_block_4$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (show_if) if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(180:6) {#each questions as q}",
    		ctx
    	});

    	return block;
    }

    // (176:4) {#each sections as s}
    function create_each_block(ctx) {
    	let t;
    	let each_1_anchor;
    	let if_block = /*s*/ ctx[31].intro && create_if_block_5(ctx);
    	let each_value_1 = /*questions*/ ctx[13];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*s*/ ctx[31].intro) if_block.p(ctx, dirty);

    			if (dirty[0] & /*questions, asks, sections*/ 24577) {
    				each_value_1 = /*questions*/ ctx[13];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(176:4) {#each sections as s}",
    		ctx
    	});

    	return block;
    }

    // (208:4) {:else}
    function create_else_block_1$1(ctx) {
    	let t0;
    	let p;
    	let t1;
    	let t2;
    	let div;
    	let button;
    	let current;
    	let if_block = /*msg*/ ctx[3] && create_if_block_3$1(ctx);

    	button = new Button({
    			props: {
    				primary: true,
    				class: "is-full-width",
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*submit*/ ctx[16]);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			p = element("p");
    			t1 = text(/*txt_disclaimer*/ ctx[12]);
    			t2 = space();
    			div = element("div");
    			create_component(button.$$.fragment);
    			add_location(p, file$6, 212, 6, 5654);
    			attr_dev(div, "class", "bottom svelte-1rerc65");
    			add_location(div, file$6, 213, 6, 5684);
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(button, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*msg*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_3$1(ctx);
    					if_block.c();
    					if_block.m(t0.parentNode, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (!current || dirty[0] & /*txt_disclaimer*/ 4096) set_data_dev(t1, /*txt_disclaimer*/ ctx[12]);
    			const button_changes = {};

    			if (dirty[0] & /*txt_submit*/ 64 | dirty[1] & /*$$scope*/ 2048) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(208:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (196:4) {#if showQR }
    function create_if_block_2$2(ctx) {
    	let p;
    	let span;
    	let t1;
    	let qrcode;
    	let t2;
    	let div0;
    	let small;
    	let t3;
    	let t4;
    	let div1;
    	let button;
    	let current;

    	qrcode = new QRJS({
    			props: {
    				codeValue: /*pro*/ ctx[2],
    				squareSize: "250"
    			},
    			$$inline: true
    		});

    	button = new Button({
    			props: {
    				outline: true,
    				secondary: true,
    				class: "is-full-width",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*redo*/ ctx[19]);

    	const block = {
    		c: function create() {
    			p = element("p");
    			span = element("span");
    			span.textContent = `${prom.name}`;
    			t1 = space();
    			create_component(qrcode.$$.fragment);
    			t2 = space();
    			div0 = element("div");
    			small = element("small");
    			t3 = text(/*txt_to_scan*/ ctx[11]);
    			t4 = space();
    			div1 = element("div");
    			create_component(button.$$.fragment);
    			add_location(span, file$6, 197, 8, 5240);
    			attr_dev(p, "class", "text-center");
    			add_location(p, file$6, 196, 6, 5208);
    			add_location(small, file$6, 202, 8, 5386);
    			attr_dev(div0, "class", "text-grey text-center block svelte-1rerc65");
    			add_location(div0, file$6, 201, 6, 5336);
    			attr_dev(div1, "class", "bottom svelte-1rerc65");
    			add_location(div1, file$6, 204, 6, 5435);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, span);
    			insert_dev(target, t1, anchor);
    			mount_component(qrcode, target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, small);
    			append_dev(small, t3);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div1, anchor);
    			mount_component(button, div1, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const qrcode_changes = {};
    			if (dirty[0] & /*pro*/ 4) qrcode_changes.codeValue = /*pro*/ ctx[2];
    			qrcode.$set(qrcode_changes);
    			if (!current || dirty[0] & /*txt_to_scan*/ 2048) set_data_dev(t3, /*txt_to_scan*/ ctx[11]);
    			const button_changes = {};

    			if (dirty[0] & /*txt_redo*/ 1024 | dirty[1] & /*$$scope*/ 2048) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(qrcode.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(qrcode.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t1);
    			destroy_component(qrcode, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div1);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(196:4) {#if showQR }",
    		ctx
    	});

    	return block;
    }

    // (209:6) {#if msg }
    function create_if_block_3$1(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*msg*/ ctx[3]);
    			attr_dev(div, "class", "text-error");
    			add_location(div, file$6, 209, 8, 5596);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*msg*/ 8) set_data_dev(t, /*msg*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(209:6) {#if msg }",
    		ctx
    	});

    	return block;
    }

    // (215:8) <Button primary on:click={submit} class="is-full-width">
    function create_default_slot_4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*txt_submit*/ ctx[6]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*txt_submit*/ 64) set_data_dev(t, /*txt_submit*/ ctx[6]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(215:8) <Button primary on:click={submit} class=\\\"is-full-width\\\">",
    		ctx
    	});

    	return block;
    }

    // (206:6) <Button outline secondary on:click={redo} class="is-full-width">
    function create_default_slot_3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*txt_redo*/ ctx[10]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*txt_redo*/ 1024) set_data_dev(t, /*txt_redo*/ ctx[10]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(206:6) <Button outline secondary on:click={redo} class=\\\"is-full-width\\\">",
    		ctx
    	});

    	return block;
    }

    // (166:2) <Button primary on:click={copy}>
    function create_default_slot_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*txt_copy*/ ctx[8]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*txt_copy*/ 256) set_data_dev(t, /*txt_copy*/ ctx[8]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(166:2) <Button primary on:click={copy}>",
    		ctx
    	});

    	return block;
    }

    // (167:2) <Button secondary on:click={download}>
    function create_default_slot_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*txt_download*/ ctx[9]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*txt_download*/ 512) set_data_dev(t, /*txt_download*/ ctx[9]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(167:2) <Button secondary on:click={download}>",
    		ctx
    	});

    	return block;
    }

    // (163:0) <Container>
    function create_default_slot$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$4, create_else_block$3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*json*/ ctx[15]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(163:0) <Container>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let container;
    	let current;

    	container = new Container({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(container.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(container, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const container_changes = {};

    			if (dirty[0] & /*txt_download, txt_copy, txt_redo, txt_to_scan, pro, showQR, txt_submit, txt_disclaimer, msg, asks, txt_next, next, current*/ 8191 | dirty[1] & /*$$scope*/ 2048) {
    				container_changes.$$scope = { dirty, ctx };
    			}

    			container.$set(container_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(container.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(container.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(container, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function copy() {
    	navigator.clipboard.writeText(JSON.stringify(prom, null, 2)).then(
    		function () {
    			console.log("Async: Copying to clipboard was successful!");
    		},
    		function (err) {
    			console.error("Async: Could not copy text: ", err);
    		}
    	);
    }

    function download() {
    	var element = document.createElement("a");
    	element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(prom, null, 2)));
    	element.setAttribute("download", prom.code + ".json");
    	element.style.display = "none";
    	document.body.appendChild(element);
    	element.click();
    	document.body.removeChild(element);
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let questions = prom.questions;
    	let sections = prom.sections;
    	let asks = {};
    	let showQR = false;
    	let pro = "";
    	let msg = "";
    	let hideSections = [];
    	let todos = [];
    	let current, next;

    	for (var i = 0; i < sections.length; i++) {
    		const s = sections[i];

    		if (s.ons && s.ons.length) {
    			hideSections.push(s);
    		} else {
    			for (var j = 0; j < questions.length; j++) {
    				const q = questions[j];

    				if (q.code.substr(0, 2) == s.code) {
    					todos.push(q);
    				}
    			}
    		}
    	}

    	current = getCurrent();
    	next = getNext();

    	function getCurrent() {
    		return todos.length >= 1 ? todos[0] : null;
    	}

    	function getNext() {
    		return todos.length >= 2 ? todos[1] : null;
    	}

    	let txt_required = "Some not answered, please check!";
    	let txt_submit = "Submit";
    	let txt_next = "Next";
    	let txt_copy = "Copy to Clipboard";
    	let txt_download = "Download as JSON file";
    	let txt_redo = "Hide & Redo";
    	let txt_to_scan = "Please hand in when consulting, or take a screenshot for the next visit.";
    	let txt_disclaimer = "DISCLAIMER: For security and privacy concern, your data will not be uploaded onto any server and it is only submitted into a QR code on your device.";

    	switch (prom.lang) {
    		case "zh-CN":
    			txt_required = "有问题未回答，请检查！";
    			txt_submit = "提交";
    			txt_next = "下一个";
    			txt_copy = "复制到剪贴板";
    			txt_download = "下载JSON文件";
    			txt_redo = "重填";
    			txt_to_scan = "请在医生电脑旁扫码二维码，或者截屏下次再扫";
    			txt_disclaimer = "声明：为了安全和隐私保护，数据不会保存在互联网上；而是压缩进了二维码，请确保仅出示给医生看！";
    			break;
    	}

    	const urlParams = new URLSearchParams(window.location.search);
    	const json = urlParams.get("json");

    	for (var i = 0; i < questions.length; i++) {
    		const q = questions[i];
    		asks[q.code] = "";
    	}

    	function submit() {
    		let count = 0;
    		$$invalidate(2, pro = prom.code + ":" + prom.lang + ":" + prom.ver);
    		const codes = Object.keys(asks);

    		for (var i = 0; i < codes.length; i++) {
    			const c = codes[i];

    			if (asks[c]) {
    				$$invalidate(2, pro += "/" + c + ":" + asks[c]);
    				count++;
    			}
    		}

    		if (count == questions.length) {
    			$$invalidate(1, showQR = true);
    		} else {
    			$$invalidate(3, msg = txt_required);
    		}
    	}

    	function submitCAT() {
    		$$invalidate(2, pro = prom.code + ":" + prom.lang + ":" + prom.ver);
    		const codes = Object.keys(asks);

    		for (var i = 0; i < codes.length; i++) {
    			const c = codes[i];

    			if (asks[c]) {
    				$$invalidate(2, pro += "/" + c + ":" + asks[c]);
    			}
    		}

    		$$invalidate(1, showQR = true);
    	}

    	function goNext() {
    		const selectedCode = asks[current.code];
    		let goto = "";

    		for (var i = 0; i < current.answers.length; i++) {
    			const ans = current.answers[i];

    			if (ans.code == selectedCode && ans.goto) {
    				goto = ans.goto;
    			}
    		}

    		if (goto) {
    			for (var i = 0; i < hideSections.length; i++) {
    				const s = hideSections[i];

    				if (s.ons.includes(goto)) {
    					for (var j = 0; j < questions.length; j++) {
    						const q = questions[j];

    						if (q.code.substr(0, 2) == s.code) {
    							todos.push(q);
    						}
    					}

    					delete hideSections[i];
    				}
    			}
    		}

    		todos.shift();
    		$$invalidate(4, current = getCurrent());
    		$$invalidate(5, next = getNext());
    	}

    	function redo() {
    		$$invalidate(1, showQR = false);
    		$$invalidate(3, msg = "");
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const $$binding_groups = [[], []];

    	function input_change_handler(q) {
    		asks[q.code] = this.__value;
    		$$invalidate(0, asks);
    		$$invalidate(13, questions);
    	}

    	function input_change_handler_1() {
    		asks[current.code] = this.__value;
    		$$invalidate(0, asks);
    		$$invalidate(4, current);
    	}

    	$$self.$capture_state = () => ({
    		Button,
    		Container,
    		Input,
    		QRCode: QRJS,
    		questions,
    		sections,
    		asks,
    		showQR,
    		pro,
    		msg,
    		hideSections,
    		todos,
    		current,
    		next,
    		i,
    		j,
    		getCurrent,
    		getNext,
    		txt_required,
    		txt_submit,
    		txt_next,
    		txt_copy,
    		txt_download,
    		txt_redo,
    		txt_to_scan,
    		txt_disclaimer,
    		urlParams,
    		json,
    		submit,
    		submitCAT,
    		goNext,
    		redo,
    		copy,
    		download
    	});

    	$$self.$inject_state = $$props => {
    		if ("questions" in $$props) $$invalidate(13, questions = $$props.questions);
    		if ("sections" in $$props) $$invalidate(14, sections = $$props.sections);
    		if ("asks" in $$props) $$invalidate(0, asks = $$props.asks);
    		if ("showQR" in $$props) $$invalidate(1, showQR = $$props.showQR);
    		if ("pro" in $$props) $$invalidate(2, pro = $$props.pro);
    		if ("msg" in $$props) $$invalidate(3, msg = $$props.msg);
    		if ("hideSections" in $$props) hideSections = $$props.hideSections;
    		if ("todos" in $$props) todos = $$props.todos;
    		if ("current" in $$props) $$invalidate(4, current = $$props.current);
    		if ("next" in $$props) $$invalidate(5, next = $$props.next);
    		if ("i" in $$props) i = $$props.i;
    		if ("j" in $$props) j = $$props.j;
    		if ("txt_required" in $$props) txt_required = $$props.txt_required;
    		if ("txt_submit" in $$props) $$invalidate(6, txt_submit = $$props.txt_submit);
    		if ("txt_next" in $$props) $$invalidate(7, txt_next = $$props.txt_next);
    		if ("txt_copy" in $$props) $$invalidate(8, txt_copy = $$props.txt_copy);
    		if ("txt_download" in $$props) $$invalidate(9, txt_download = $$props.txt_download);
    		if ("txt_redo" in $$props) $$invalidate(10, txt_redo = $$props.txt_redo);
    		if ("txt_to_scan" in $$props) $$invalidate(11, txt_to_scan = $$props.txt_to_scan);
    		if ("txt_disclaimer" in $$props) $$invalidate(12, txt_disclaimer = $$props.txt_disclaimer);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		asks,
    		showQR,
    		pro,
    		msg,
    		current,
    		next,
    		txt_submit,
    		txt_next,
    		txt_copy,
    		txt_download,
    		txt_redo,
    		txt_to_scan,
    		txt_disclaimer,
    		questions,
    		sections,
    		json,
    		submit,
    		submitCAT,
    		goNext,
    		redo,
    		input_change_handler,
    		$$binding_groups,
    		input_change_handler_1
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
